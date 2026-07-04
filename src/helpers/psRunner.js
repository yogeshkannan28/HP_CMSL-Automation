/**
 * psRunner.js — PowerShell Execution Engine
 * 
 * This is the CORE of the framework. Every test ultimately calls this.
 * It spawns a PowerShell process, runs a command, and returns structured output.
 * 
 * Architecture:
 *   test file → module (POM) → psRunner → pwsh.exe → HP CMSL
 *                                ^^^^^^^^
 *                              YOU ARE HERE
 * 
 * Usage:
 *   const { runCommand } = require('./psRunner');
 *   const result = await runCommand('Get-HPBIOSSettingsList');
 *   // result = { stdout, stderr, exitCode, success, duration }
 */

const { spawn } = require('child_process');
const settings = require('../../config/settings');

// Optional persistent PS pool (src/core/psPool.ts). When set (by
// src/core/globalSetup.ts or the agent CLI), runCommand delegates to it
// instead of spawning a fresh pwsh.exe per call. All 8 POM modules already
// funnel through runCommand, so they get pooling for free with no changes.
// Unset (plain unit tests, standalone preflight, etc.) → today's spawn
// behavior, unchanged.
let activePool = null;

function setPool(pool) {
  activePool = pool;
}

function getPool() {
  return activePool;
}

/**
 * Execute a PowerShell command and return structured results.
 *
 * @param {string} command - The PowerShell command to execute
 * @param {Object} options - Optional overrides
 * @param {number} options.timeout - Timeout in ms (default: settings.powershell.defaultTimeout)
 * @param {string} options.shell - PS executable override (default: settings.powershell.executable)
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number, success: boolean, duration: number}>}
 */
async function runCommand(command, options = {}) {
  if (activePool) {
    return activePool.run(command, options);
  }

  const {
    timeout = settings.powershell.defaultTimeout,
    shell = settings.powershell.executable,
  } = options;

  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const args = [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy', settings.powershell.executionPolicy,
      '-Command', command,
    ];

    const ps = spawn(shell, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    ps.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ps.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Timeout guard
    const timer = setTimeout(() => {
      ps.kill('SIGTERM');
      reject(new Error(
        `Command timed out after ${timeout}ms:\n` +
        `  Command: ${command}\n` +
        `  Partial stdout: ${stdout.substring(0, 500)}`
      ));
    }, timeout);

    ps.on('close', (exitCode) => {
      clearTimeout(timer);
      const duration = Date.now() - startTime;

      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: exitCode ?? -1,
        success: exitCode === 0,
        duration,
      });
    });

    ps.on('error', (err) => {
      clearTimeout(timer);
      const duration = Date.now() - startTime;

      // If pwsh.exe not found, try fallback
      if (err.code === 'ENOENT' && shell === settings.powershell.executable) {
        console.warn(
          `⚠️  ${shell} not found. Falling back to ${settings.powershell.fallbackExecutable}`
        );
        runCommand(command, {
          ...options,
          shell: settings.powershell.fallbackExecutable,
        })
          .then(resolve)
          .catch(reject);
        return;
      }

      reject(new Error(
        `Failed to spawn PowerShell:\n` +
        `  Shell: ${shell}\n` +
        `  Error: ${err.message}\n` +
        `  Duration: ${duration}ms`
      ));
    });
  });
}

/**
 * Run a PowerShell command that returns JSON and parse the output.
 * 
 * @param {string} command - PS command (should output JSON via ConvertTo-Json)
 * @param {Object} options - Same options as runCommand
 * @returns {Promise<{data: any, raw: Object}>} Parsed JSON data + raw result
 */
async function runCommandJson(command, options = {}) {
  const result = await runCommand(command, options);

  if (!result.success) {
    throw new Error(
      `Command failed with exit code ${result.exitCode}:\n` +
      `  Command: ${command}\n` +
      `  stderr: ${result.stderr}`
    );
  }

  try {
    const data = JSON.parse(result.stdout);
    return { data, raw: result };
  } catch (parseErr) {
    throw new Error(
      `Failed to parse JSON output:\n` +
      `  Command: ${command}\n` +
      `  stdout: ${result.stdout.substring(0, 1000)}\n` +
      `  Parse error: ${parseErr.message}`
    );
  }
}

/**
 * Import an HP CMSL module before running a command.
 * Wraps the command with Import-Module for safety.
 * 
 * @param {string} moduleName - HP module name (e.g. 'HP.ClientManagement')
 * @param {string} command - The CMSL command to run after import
 * @param {Object} options - Same options as runCommand
 * @returns {Promise<Object>} Same as runCommand
 */
async function runCMSLCommand(moduleName, command, options = {}) {
  const wrappedCommand = `Import-Module ${moduleName} -ErrorAction Stop; ${command}`;
  return runCommand(wrappedCommand, options);
}

/**
 * Run a CMSL command and parse JSON output.
 * 
 * @param {string} moduleName - HP module name
 * @param {string} command - The CMSL command (should output JSON)
 * @param {Object} options - Same options as runCommand
 * @returns {Promise<{data: any, raw: Object}>}
 */
async function runCMSLCommandJson(moduleName, command, options = {}) {
  const wrappedCommand = `Import-Module ${moduleName} -ErrorAction Stop; ${command}`;
  return runCommandJson(wrappedCommand, options);
}

module.exports = {
  runCommand,
  runCommandJson,
  runCMSLCommand,
  runCMSLCommandJson,
  setPool,
  getPool,
};
