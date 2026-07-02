import type { Config } from 'jest';

/**
 * Shared Jest config fragment. Read/mutating/unit configs spread this and
 * override testMatch/maxWorkers — kept in one place so the swc transform
 * setup and reporters don't drift between the three entry points.
 */
const baseConfig: Config = {
  testTimeout: 60000,
  verbose: true,
  transform: {
    '^.+\\.tsx?$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2022',
          parser: { syntax: 'typescript' },
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  reporters: [
    'default',
    ['<rootDir>/src/core/jsonReporter.ts', { outputDir: './reports' }],
  ],
};

export default baseConfig;
