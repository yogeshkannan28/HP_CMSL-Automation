/**
 * jsonReporter.ts — Custom Jest Reporter (TS port of
 * src/helpers/jsonReporter.js). Extends the original onRunComplete-only
 * report with per-test tagging in onTestResult: which POM module a test
 * belongs to, and whether it's a mutating test (by path convention — files
 * under tests/<module>/mutating/ match jest.mutating.config.ts's testMatch).
 * This lets the agent tell "failing mutation" apart from "failing read" at a
 * glance instead of re-deriving it from the test title.
 */
import fs from 'fs';
import path from 'path';

// Folder name (under tests/) → POM module name, mirrors src/modules/*.meta.ts.
const MODULE_BY_TEST_DIR: Record<string, string> = {
  'bios-device': 'BiosDevice',
  consent: 'Consent',
  docks: 'Docks',
  firmware: 'Firmware',
  notifications: 'Notifications',
  retail: 'Retail',
  'softpaq-mgmt': 'SoftPaqManagement',
  'softpaq-repo': 'SoftPaqRepository',
};

function moduleForTestPath(testFilePath: string): string | null {
  const normalized = testFilePath.split(path.sep).join('/');
  const match = normalized.match(/\/tests\/([^/]+)\//);
  if (!match) return null;
  return MODULE_BY_TEST_DIR[match[1]] ?? null;
}

function mutatesForTestPath(testFilePath: string): boolean {
  return testFilePath.split(path.sep).join('/').includes('/mutating/');
}

interface JestTestResultLike {
  title: string;
  fullName: string;
  status: string;
  duration: number | null;
  failureMessages: string[];
}

interface JestTestFileResultLike {
  testFilePath: string;
  numPassingTests: number;
  numFailingTests: number;
  numPendingTests: number;
  testResults: JestTestResultLike[];
}

interface JestAggregatedResultLike {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  success: boolean;
  startTime: number;
  testResults: JestTestFileResultLike[];
}

interface ReporterOptions {
  outputDir?: string;
}

interface TaggedTestEntry {
  testFilePath: string;
  module: string | null;
  mutates: boolean;
  title: string;
  fullName: string;
  status: string;
  duration: number | null;
  failureMessages: string[];
}

class JsonReporter {
  private outputDir: string;
  private taggedResults: TaggedTestEntry[] = [];

  constructor(_globalConfig: unknown, options?: ReporterOptions) {
    this.outputDir = options?.outputDir ?? './reports';
  }

  onTestResult(_test: unknown, testResult: JestTestFileResultLike): void {
    const module = moduleForTestPath(testResult.testFilePath);
    const mutates = mutatesForTestPath(testResult.testFilePath);

    for (const test of testResult.testResults) {
      this.taggedResults.push({
        testFilePath: testResult.testFilePath,
        module,
        mutates,
        title: test.title,
        fullName: test.fullName,
        status: test.status,
        duration: test.duration,
        failureMessages: test.failureMessages,
      });
    }
  }

  onRunComplete(_contexts: unknown, results: JestAggregatedResultLike): void {
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
      taggedResults: this.taggedResults,
    };

    const outputPath = path.join(this.outputDir, 'test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Test report saved to: ${outputPath}`);
  }
}

// Required by Jest via a string path in jest config (reporters: [[<path>, opts]]),
// which uses plain require() — module.exports must be the class itself.
module.exports = JsonReporter;
