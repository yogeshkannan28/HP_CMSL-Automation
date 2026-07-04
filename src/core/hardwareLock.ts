import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import settings from '../../config/settings';

/**
 * Cross-process mutex around real HP hardware (BIOS/dock/repo/consent state).
 * The real hazard isn't Jest's own worker count (that's controlled separately)
 * — it's the Ollama agent, an MCP client, or a second CI job touching the same
 * physical device concurrently. Backed by a plain lockfile so it works across
 * processes on Windows, unlike an in-process mutex.
 */
function ensureLockFileExists(): void {
  const lockPath = settings.hardwareLock.lockFilePath;
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  if (!fs.existsSync(lockPath)) {
    fs.writeFileSync(lockPath, '');
  }
}

export async function withHardwareLock<T>(fn: () => Promise<T>): Promise<T> {
  ensureLockFileExists();
  const lockPath = settings.hardwareLock.lockFilePath;

  const release = await lockfile.lock(lockPath, {
    realpath: false,
    stale: settings.hardwareLock.staleTimeoutMs,
    retries: {
      retries: settings.hardwareLock.retryCount,
      minTimeout: settings.hardwareLock.retryMinTimeoutMs,
    },
  });

  try {
    return await fn();
  } finally {
    await release();
  }
}
