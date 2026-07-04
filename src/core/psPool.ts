import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';
import settings from '../../config/settings';
import { buildWorkerScript } from './psPoolWorkerScript';

export interface PoolCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
  duration: number;
}

interface PendingEntry {
  resolve: (result: PoolCommandResult) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  startedAt: number;
}

interface Worker {
  id: number;
  proc: ChildProcessWithoutNullStreams;
  scriptPath: string;
  ready: boolean;
  busy: boolean;
  dead: boolean;
  pending: Map<string, PendingEntry>;
}

let requestCounter = 0;

/**
 * Persistent pool of pwsh.exe workers, each with HP.* modules pre-imported.
 * Mutating-vs-read-only routing is intentionally NOT special-cased here:
 * src/core/hardwareLock.ts already serializes all mutating tool calls
 * cross-process, so at most one mutating command is ever in flight system
 * wide regardless of which pool worker happens to run it.
 */
export class PSPool {
  private workers: Worker[] = [];
  private size: number;
  private waitQueue: Array<() => void> = [];
  private startPromise: Promise<void> | null = null;
  private shuttingDown = false;

  constructor(size: number = settings.powershell.poolSize) {
    this.size = size;
  }

  async start(): Promise<void> {
    if (this.startPromise) return this.startPromise;
    this.startPromise = (async () => {
      for (let i = 0; i < this.size; i++) {
        await this.spawnWorker(i);
      }
    })();
    return this.startPromise;
  }

  private async spawnWorker(id: number): Promise<void> {
    const script = buildWorkerScript(settings.cmsl.modules);
    const scriptPath = path.join(
      os.tmpdir(),
      `hp-cmsl-pool-worker-${process.pid}-${id}-${Date.now()}.ps1`
    );
    fs.writeFileSync(scriptPath, script, 'utf8');

    const proc = spawn(
      settings.powershell.executable,
      ['-NoProfile', '-NonInteractive', '-NoLogo', '-ExecutionPolicy', settings.powershell.executionPolicy, '-File', scriptPath],
      { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true }
    );

    const worker: Worker = {
      id,
      proc,
      scriptPath,
      ready: false,
      busy: false,
      dead: false,
      pending: new Map(),
    };

    const rl = readline.createInterface({ input: proc.stdout });
    rl.on('line', (line) => this.handleLine(worker, line));
    proc.on('exit', () => this.handleWorkerExit(worker));
    proc.on('error', () => this.handleWorkerExit(worker));

    this.workers[id] = worker;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`PS pool worker ${id} did not become ready within ${settings.powershell.workerCommandTimeout}ms`));
      }, settings.powershell.workerCommandTimeout);
      const poll = setInterval(() => {
        if (worker.ready) {
          clearInterval(poll);
          clearTimeout(timeout);
          resolve();
        }
        if (worker.dead) {
          clearInterval(poll);
          clearTimeout(timeout);
          reject(new Error(`PS pool worker ${id} exited before becoming ready`));
        }
      }, 25);
    });
  }

  private handleLine(worker: Worker, line: string): void {
    let parsed: { ready?: boolean; id?: string; stdoutB64?: string; stderrB64?: string; exitCode?: number };
    try {
      parsed = JSON.parse(line);
    } catch {
      return;
    }

    if (parsed.ready) {
      worker.ready = true;
      this.releaseWaiter();
      return;
    }

    if (!parsed.id) return;
    const entry = worker.pending.get(parsed.id);
    if (!entry) return;

    worker.pending.delete(parsed.id);
    worker.busy = worker.pending.size > 0;
    clearTimeout(entry.timer);

    const stdout = Buffer.from(parsed.stdoutB64 ?? '', 'base64').toString('utf8').trim();
    const stderr = Buffer.from(parsed.stderrB64 ?? '', 'base64').toString('utf8').trim();
    const exitCode = parsed.exitCode ?? 1;

    entry.resolve({
      stdout,
      stderr,
      exitCode,
      success: exitCode === 0,
      duration: Date.now() - entry.startedAt,
    });

    this.releaseWaiter();
  }

  private handleWorkerExit(worker: Worker): void {
    if (worker.dead || this.shuttingDown) {
      worker.dead = true;
      return;
    }
    worker.dead = true;
    try {
      fs.unlinkSync(worker.scriptPath);
    } catch {
      /* best-effort cleanup */
    }

    for (const entry of worker.pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(new Error(`PS pool worker ${worker.id} died mid-request`));
    }
    worker.pending.clear();

    console.warn(`PS pool worker ${worker.id} exited unexpectedly — respawning`);
    this.spawnWorker(worker.id).catch((err) => {
      console.error(`Failed to respawn PS pool worker ${worker.id}: ${err.message}`);
    });
  }

  private findIdleWorker(): Worker | null {
    for (const worker of this.workers) {
      if (worker && worker.ready && !worker.dead && !worker.busy) return worker;
    }
    return null;
  }

  private releaseWaiter(): void {
    const next = this.waitQueue.shift();
    if (next) next();
  }

  private async acquireWorker(): Promise<Worker> {
    let worker = this.findIdleWorker();
    while (!worker) {
      await new Promise<void>((resolve) => this.waitQueue.push(resolve));
      worker = this.findIdleWorker();
    }
    worker.busy = true;
    return worker;
  }

  async run(command: string, options: { timeout?: number } = {}): Promise<PoolCommandResult> {
    if (this.shuttingDown) {
      throw new Error('PS pool is shutting down, cannot accept new commands');
    }
    const timeout = options.timeout ?? settings.powershell.workerCommandTimeout;
    const worker = await this.acquireWorker();
    const id = `${process.pid}-${++requestCounter}`;

    return new Promise<PoolCommandResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        worker.pending.delete(id);
        reject(new Error(`Command timed out after ${timeout}ms on pool worker ${worker.id}:\n  Command: ${command}`));
        // A worker that misses its timeout is presumed hung — kill and let
        // the exit handler respawn it rather than leaving it silently wedged.
        worker.proc.kill('SIGTERM');
      }, timeout);

      worker.pending.set(id, { resolve, reject, timer, startedAt: Date.now() });
      worker.proc.stdin.write(JSON.stringify({ id, command }) + '\n');
    });
  }

  async drain(): Promise<void> {
    while (this.workers.some((w) => w && w.busy)) {
      await new Promise((r) => setTimeout(r, 25));
    }
  }

  async shutdown(): Promise<void> {
    this.shuttingDown = true;
    await this.drain();
    for (const worker of this.workers) {
      if (!worker || worker.dead) continue;
      worker.proc.stdin.end();
      worker.proc.kill('SIGTERM');
      try {
        fs.unlinkSync(worker.scriptPath);
      } catch {
        /* best-effort cleanup */
      }
    }
    this.workers = [];
  }

  isReady(): boolean {
    return this.workers.length > 0 && this.workers.every((w) => w && w.ready && !w.dead);
  }
}
