/**
 * jsonReporter.js — Custom Jest Reporter for JSON output
 * 
 * Writes test results to reports/ folder as a JSON file.
 * This enables CI/CD pipelines to parse and display results.
 */

const fs = require('fs');
const path = require('path');

class JsonReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.outputDir = (options && options.outputDir) || './reports';
  }

  onRunComplete(contexts, results) {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      numTotalTests: results.numTotalTests,
      numPassedTests: results.numPassedTests,
      numFailedTests: results.numFailedTests,
      numPendingTests: results.numPendingTests,
      success: results.success,
      startTime: results.startTime,
      testResults: results.testResults.map((suite) => ({
        testFilePath: suite.testFilePath,
        numPassingTests: suite.numPassingTests,
        numFailingTests: suite.numFailingTests,
        numPendingTests: suite.numPendingTests,
        testResults: suite.testResults.map((test) => ({
          title: test.title,
          fullName: test.fullName,
          status: test.status,
          duration: test.duration,
          failureMessages: test.failureMessages,
        })),
      })),
    };

    const outputPath = path.join(this.outputDir, 'test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Test report saved to: ${outputPath}`);
  }
}

module.exports = JsonReporter;
