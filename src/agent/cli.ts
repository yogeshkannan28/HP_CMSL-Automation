/**
 * cli.ts — entrypoint behind the `agent:run` / `agent:watch` npm scripts.
 *
 * Consumes the latest reports/test-results.json (written by
 * src/core/jsonReporter.ts after `npm test`/`npm run test:readonly`/
 * `test:mutating`) rather than re-running the suite itself — running tests
 * is `npm test`'s job; this CLI investigates whatever failures are already
 * on record. For each failing test it runs the ReAct loop, and — for
 * failures the model attributes to a script bug rather than hardware/env —
 * attempts the fix loop, up to settings.agent.maxFixAttemptsPerFailure times.
 */
import fs from 'fs';
import path from 'path';
import settings from '../../config/settings';
import { runAllChecks } from '../core/platformGuard';
import { PSPool } from '../core/psPool';
import { createOllamaModel } from './ollamaModel';
import { buildAgentTools } from './tools';
import { runReactLoop } from './reactLoop';
import { runFixLoop } from './fixLoop';

interface PSRunnerModule {
  setPool: (pool: PSPool) => void;
}
const { setPool }: PSRunnerModule = require('../helpers/psRunner');

interface TaggedResult {
  testFilePath: string;
  module: string | null;
  mutates: boolean;
  title: string;
  fullName: string;
  status: string;
  failureMessages: string[];
}

interface TestReport {
  taggedResults?: TaggedResult[];
}

function parseArgs(argv: string[]): { mode: 'once' | 'watch'; module: string | null } {
  const mode = argv.includes('--watch') ? 'watch' : 'once';
  const moduleIdx = argv.indexOf('--module');
  const module = moduleIdx >= 0 ? argv[moduleIdx + 1] ?? null : null;
  return { mode, module };
}

function loadFailingTests(moduleFilter: string | null): TaggedResult[] {
  const reportPath = path.join(settings.reports.outputDir, settings.reports.jsonFileName);
  if (!fs.existsSync(reportPath)) {
    console.warn(
      `No test report found at ${reportPath}. Run "npm test" (or test:readonly/test:mutating) first ` +
        `so the agent has failures to investigate.`
    );
    return [];
  }

  const report: TestReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const tagged = report.taggedResults ?? [];

  return tagged.filter((t) => {
    if (t.status !== 'failed') return false;
    if (moduleFilter && t.module !== moduleFilter) return false;
    return true;
  });
}

async function investigateFailure(
  llm: ReturnType<typeof createOllamaModel>,
  tools: ReturnType<typeof buildAgentTools>,
  failure: TaggedResult
): Promise<void> {
  const task =
    `Test "${failure.fullName}" in ${failure.testFilePath} (module: ${failure.module ?? 'unknown'}) failed.\n` +
    `Failure output:\n${failure.failureMessages.join('\n')}\n\n` +
    `Investigate using read-only tools first and determine whether this is a hardware/environment issue ` +
    `or a bug in the test script itself.`;

  console.log(`\n🔎 Investigating: ${failure.fullName}`);
  const result = await runReactLoop(llm, tools, task);
  console.log(`   Verdict: ${result.verdict}`);
  console.log(`   ${result.finalAnswer}`);

  if (result.verdict !== 'SCRIPT_BUG' || !settings.agent.fixLoopEnabled || !failure.module) {
    return;
  }

  for (let attempt = 1; attempt <= settings.agent.maxFixAttemptsPerFailure; attempt++) {
    console.log(`   🔧 Fix attempt ${attempt}/${settings.agent.maxFixAttemptsPerFailure}...`);
    const outcome = await runFixLoop(llm, {
      module: failure.module,
      testFilePath: failure.testFilePath,
      failureContext: `${task}\n\nAgent verdict: ${result.finalAnswer}`,
    });

    if (outcome.success) {
      console.log(`   ✅ Fix verified on branch "${outcome.branch}". Report: ${outcome.reportPath}`);
      break;
    }
    console.log(`   ❌ Fix attempt failed: ${outcome.reason}`);
  }
}

async function processOnce(module: string | null): Promise<void> {
  const failures = loadFailingTests(module);
  if (failures.length === 0) {
    console.log('No failing tests to investigate.');
    return;
  }

  const llm = createOllamaModel();
  const tools = buildAgentTools();

  for (const failure of failures) {
    await investigateFailure(llm, tools, failure);
  }
}

async function withPool<T>(fn: () => Promise<T>): Promise<T> {
  const pool = new PSPool();
  try {
    await pool.start();
    setPool(pool);
    return await fn();
  } finally {
    await pool.shutdown();
    setPool(null as unknown as PSPool);
  }
}

async function main(): Promise<void> {
  const { mode, module } = parseArgs(process.argv.slice(2));

  await runAllChecks();

  await withPool(async () => {
    if (mode === 'once') {
      await processOnce(module);
      return;
    }

    console.log(`Agent watch mode: re-checking ${settings.reports.jsonFileName} every 60s. Ctrl+C to stop.`);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await processOnce(module);
      await new Promise((resolve) => setTimeout(resolve, 60_000));
    }
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
