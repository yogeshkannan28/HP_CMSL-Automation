import type { Config } from 'jest';
import baseConfig from './jest.base.config';

/**
 * Pure unit tests (psQuote escaping, tool registry wiring, patch guard) —
 * no hardware, no PowerShell, no globalSetup/preflight required.
 */
const config: Config = {
  ...baseConfig,
  displayName: 'unit',
  rootDir: '.',
  roots: ['<rootDir>/tests/unit'],
  testMatch: ['**/tests/unit/**/*.test.ts'],
  maxWorkers: '50%',
  reporters: ['default'],
};

export default config;
