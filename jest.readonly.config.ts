import type { Config } from 'jest';
import baseConfig from './jest.base.config';

/**
 * Read-only cmdlet suites. Runs as a single Jest worker (maxWorkers: 1) —
 * concurrency comes from Promise.all inside test files dispatching onto the
 * shared in-process PowerShell pool (src/core/psPool.ts), not from Jest's
 * own multi-process workers. See plan Phase 3 for why: spreading the pool
 * across multiple Jest worker processes would multiply pwsh.exe instances
 * (N pools x M workers) instead of sharing one pool.
 */
const config: Config = {
  ...baseConfig,
  displayName: 'readonly',
  rootDir: '.',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/.*/mutating/', '/tests/unit/'],
  maxWorkers: 1,
  globalSetup: '<rootDir>/src/core/globalSetup.ts',
  globalTeardown: '<rootDir>/src/core/globalTeardown.ts',
};

export default config;
