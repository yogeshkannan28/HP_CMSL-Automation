import type { Config } from 'jest';
import baseConfig from './jest.base.config';

/**
 * State-mutating cmdlet suites (BIOS Set-*, dock firmware flash, repo writes,
 * consent toggles). Always runInBand + maxWorkers: 1 — the cross-process
 * hardware lock (src/core/hardwareLock.ts) is the real safety net (it also
 * guards against the Ollama agent or a second CI job touching the same
 * hardware concurrently), but there is no reason to invite races locally.
 */
const config: Config = {
  ...baseConfig,
  displayName: 'mutating',
  rootDir: '.',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/tests/**/mutating/*.test.ts'],
  maxWorkers: 1,
  globalSetup: '<rootDir>/src/core/globalSetup.ts',
  globalTeardown: '<rootDir>/src/core/globalTeardown.ts',
};

export default config;
