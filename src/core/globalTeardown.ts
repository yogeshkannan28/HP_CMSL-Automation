/**
 * globalTeardown.ts — Jest Global Teardown. Shuts down the PS pool started in
 * globalSetup.ts, retrieved via the `global` object Jest shares between the
 * two (see globalSetup.ts for why not a module-level singleton).
 */
import type { PSPool } from './psPool';

export default async function globalTeardown(): Promise<void> {
  const pool = (global as unknown as { __PS_POOL__?: PSPool }).__PS_POOL__;
  if (pool) {
    await pool.shutdown();
  }
}
