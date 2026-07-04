/**
 * globalSetup.ts — Jest Global Setup (TS port of src/helpers/globalSetup.js).
 * Runs once before the entire test suite: pre-flight checks, then starts the
 * persistent PS pool and wires it into psRunner so every POM module call
 * (unchanged .js files) transparently gets pooled execution.
 */
import { runAllChecks } from './platformGuard';
import { PSPool } from './psPool';

interface PSRunnerModule {
  setPool: (pool: PSPool) => void;
}
const { setPool }: PSRunnerModule = require('../helpers/psRunner');

export default async function globalSetup(): Promise<void> {
  try {
    await runAllChecks();
  } catch (error) {
    console.error('\n🚫 SUITE ABORTED — Pre-flight check failed:\n');
    console.error((error as Error).message);
    console.error('\nFix the issue above and run tests again.\n');
    process.exit(1);
  }

  const pool = new PSPool();
  await pool.start();
  setPool(pool);

  // Jest runs globalSetup/globalTeardown in the same process and shares this
  // `global` object between the two (but not with test-file workers) — the
  // documented way to hand the pool off to globalTeardown for shutdown.
  (global as unknown as { __PS_POOL__?: PSPool }).__PS_POOL__ = pool;
}
