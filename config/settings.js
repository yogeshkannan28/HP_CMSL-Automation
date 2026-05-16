/**
 * settings.js — Central configuration for HP CMSL Automation
 * 
 * Modify these values based on your environment.
 * This is the ONLY file you should need to change per machine.
 */

const path = require('path');

module.exports = {
  // ─── PowerShell Configuration ───────────────────────────────────
  powershell: {
    // Prefer PS 7 (pwsh.exe), fallback to PS 5.1 (powershell.exe)
    executable: 'pwsh.exe',
    fallbackExecutable: 'powershell.exe',

    // Default timeout for command execution (ms)
    defaultTimeout: 30000,

    // Execution policy for running scripts
    executionPolicy: 'Bypass',
  },

  // ─── HP CMSL Configuration ─────────────────────────────────────
  cmsl: {
    // Module name to check if CMSL is installed
    moduleName: 'HPCMSL',

    // Minimum required version (null = any version)
    minimumVersion: null,

    // Individual sub-modules to test
    modules: [
      'HP.Private',
      'HP.ClientManagement',
      'HP.Firmware',
      'HP.Retail',
      'HP.Consent',
      'HP.Notifications',
      'HP.Docks',
      'HP.Sinks',
      'HP.Softpaq',
      'HP.Repo',
    ],
  },

  // ─── Report Configuration ──────────────────────────────────────
  reports: {
    outputDir: path.join(__dirname, '..', 'reports'),
    jsonFileName: 'test-results.json',
    htmlFileName: 'test-report.html',
  },

  // ─── Platform Tags ─────────────────────────────────────────────
  platform: {
    // Set these based on the device under test
    os: process.platform,        // 'win32'
    arch: process.arch,          // 'x64'
    nodeVersion: process.version, // e.g. 'v20.x.x'
  },
};
