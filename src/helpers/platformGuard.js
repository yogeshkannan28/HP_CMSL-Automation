/**
 * platformGuard.js — Pre-flight Environment Validator
 * 
 * Checks that the test machine meets all requirements BEFORE any test runs.
 * Fails fast with clear, actionable error messages.
 * 
 * Checks:
 *   1. Running on Windows
 *   2. Running with Administrator privileges
 *   3. PowerShell 7 (pwsh) is available (or PS 5.1 fallback)
 *   4. HP CMSL module is installed
 * 
 * Can be run standalone:  node src/helpers/platformGuard.js
 * Or called from globalSetup.js before Jest runs.
 */

const { runCommand } = require('./psRunner');

/**
 * Check #1: Are we on Windows?
 */
function checkWindows() {
  if (process.platform !== 'win32') {
    throw new Error(
      '❌ PLATFORM CHECK FAILED: HP CMSL requires Windows.\n' +
      `   Detected OS: ${process.platform}\n` +
      '   This framework must run on a Windows 10/11 machine with HP hardware.'
    );
  }
  console.log('✅ Platform: Windows detected');
}

/**
 * Check #2: Are we running as Administrator?
 */
async function checkAdmin() {
  const result = await runCommand(
    '([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)'
  );

  const isAdmin = result.stdout.trim().toLowerCase() === 'true';

  if (!isAdmin) {
    throw new Error(
      '❌ ADMIN CHECK FAILED: HP CMSL commands require Administrator privileges.\n' +
      '   How to fix:\n' +
      '   1. Right-click on Terminal / VS Code\n' +
      '   2. Select "Run as Administrator"\n' +
      '   3. Run the tests again'
    );
  }
  console.log('✅ Privileges: Running as Administrator');
}

/**
 * Check #3: Is PowerShell available? Which version?
 */
async function checkPowerShell() {
  const result = await runCommand('$PSVersionTable.PSVersion.ToString()');

  if (!result.success) {
    throw new Error(
      '❌ POWERSHELL CHECK FAILED: Could not determine PowerShell version.\n' +
      `   stderr: ${result.stderr}\n` +
      '   Ensure pwsh.exe (PS 7) or powershell.exe (PS 5.1) is in your PATH.'
    );
  }

  const version = result.stdout.trim();
  console.log(`✅ PowerShell: Version ${version}`);
  return version;
}

/**
 * Check #4: Is HP CMSL installed?
 */
async function checkCMSL() {
  const result = await runCommand(
    'Get-Module -ListAvailable -Name HPCMSL | Select-Object -ExpandProperty Version | ForEach-Object { $_.ToString() }'
  );

  if (!result.success || !result.stdout.trim()) {
    throw new Error(
      '❌ HP CMSL CHECK FAILED: HPCMSL module not found.\n' +
      '   How to install:\n' +
      '   1. Open PowerShell as Administrator\n' +
      '   2. Run: Install-Module -Name HPCMSL -Force -AcceptLicense\n' +
      '   3. Run the tests again\n' +
      '\n' +
      '   Documentation: https://developers.hp.com/hp-client-management/doc/client-management-script-library'
    );
  }

  const version = result.stdout.trim();
  console.log(`✅ HP CMSL: Version ${version}`);
  return version;
}

/**
 * Check #5: List available HP sub-modules
 */
async function checkSubModules() {
  const result = await runCommand(
    "Get-Module -ListAvailable -Name 'HP.*' | Select-Object Name, Version | ForEach-Object { \"$($_.Name) v$($_.Version)\" }"
  );

  if (result.success && result.stdout.trim()) {
    const modules = result.stdout.trim().split('\n').map(m => m.trim()).filter(Boolean);
    console.log(`✅ HP Sub-modules found (${modules.length}):`);
    modules.forEach(m => console.log(`   → ${m}`));
    return modules;
  }

  console.warn('⚠️  Could not enumerate HP sub-modules (non-fatal)');
  return [];
}

/**
 * Run ALL pre-flight checks. Throws on first failure.
 */
async function runAllChecks() {
  console.log('\n🔍 ═══════════════════════════════════════════════');
  console.log('   HP CMSL Automation — Pre-flight Checks');
  console.log('═══════════════════════════════════════════════════\n');

  checkWindows();
  await checkAdmin();
  const psVersion = await checkPowerShell();
  const cmslVersion = await checkCMSL();
  const subModules = await checkSubModules();

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   ✅ All pre-flight checks PASSED');
  console.log('═══════════════════════════════════════════════════\n');

  return { psVersion, cmslVersion, subModules };
}

// Allow standalone execution: node src/helpers/platformGuard.js
if (require.main === module) {
  runAllChecks()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n' + err.message);
      process.exit(1);
    });
}

module.exports = {
  checkWindows,
  checkAdmin,
  checkPowerShell,
  checkCMSL,
  checkSubModules,
  runAllChecks,
};
