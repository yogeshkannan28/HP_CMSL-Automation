/**
 * globalSetup.js — Jest Global Setup
 * 
 * Runs ONCE before the entire test suite starts.
 * Executes all platform guard checks. If any check fails,
 * the entire suite is aborted with a clear error message.
 */

const { runAllChecks } = require('./platformGuard');

module.exports = async function globalSetup() {
  try {
    await runAllChecks();
  } catch (error) {
    console.error('\n🚫 SUITE ABORTED — Pre-flight check failed:\n');
    console.error(error.message);
    console.error('\nFix the issue above and run tests again.\n');
    process.exit(1);
  }
};
