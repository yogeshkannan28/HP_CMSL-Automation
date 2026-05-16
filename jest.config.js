/** @type {import('jest').Config} */
module.exports = {
  // Root directories for test discovery
  roots: ['<rootDir>/tests'],

  // Test file patterns
  testMatch: ['**/*.test.js'],

  // Timeout per test — CMSL commands can be slow
  testTimeout: 60000,

  // Verbose output for clear pass/fail visibility
  verbose: true,

  // Run tests sequentially (not parallel) since we're on a single machine
  maxWorkers: 1,

  // Global setup — runs platform guard before entire suite
  globalSetup: '<rootDir>/src/helpers/globalSetup.js',

  // Reporter configuration
  reporters: [
    'default',
    [
      '<rootDir>/src/helpers/jsonReporter.js',
      { outputDir: './reports' }
    ]
  ]
};
