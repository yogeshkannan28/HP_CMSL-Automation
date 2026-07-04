/**
 * platformGuard.ts — Pre-flight Environment Validator (TS port of
 * src/helpers/platformGuard.js). Same 5 checks, same messages; typed and
 * imported by src/core/globalSetup.ts as well as the standalone `preflight`
 * npm script.
 */
interface PSRunnerModule {
  runCommand: (command: string, options?: { timeout?: number; shell?: string }) => Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
    success: boolean;
    duration: number;
  }>;
}
// src/helpers/psRunner.js isn't a TS-included file — require() it untyped and
// cast, rather than broadening tsconfig's `include` beyond src/modules/**/*.js.
const { runCommand }: PSRunnerModule = require('../helpers/psRunner');

function checkWindows(): void {
  if (process.platform !== 'win32') {
    throw new Error(
      '❌ PLATFORM CHECK FAILED: HP CMSL requires Windows.\n' +
      `   Detected OS: ${process.platform}\n` +
      '   This framework must run on a Windows 10/11 machine with HP hardware.'
    );
  }
  console.log('✅ Platform: Windows detected');
}

async function checkAdmin(): Promise<void> {
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

async function checkPowerShell(): Promise<string> {
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

async function checkCMSL(): Promise<string> {
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

async function checkSubModules(): Promise<string[]> {
  const result = await runCommand(
    "Get-Module -ListAvailable -Name 'HP.*' | Select-Object Name, Version | ForEach-Object { \"$($_.Name) v$($_.Version)\" }"
  );

  if (result.success && result.stdout.trim()) {
    const modules = result.stdout.trim().split('\n').map((m: string) => m.trim()).filter(Boolean);
    console.log(`✅ HP Sub-modules found (${modules.length}):`);
    modules.forEach((m: string) => console.log(`   → ${m}`));
    return modules;
  }

  console.warn('⚠️  Could not enumerate HP sub-modules (non-fatal)');
  return [];
}

export interface PreflightResult {
  psVersion: string;
  cmslVersion: string;
  subModules: string[];
}

async function runAllChecks(): Promise<PreflightResult> {
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

// Allow standalone execution: node -r @swc-node/register src/core/platformGuard.ts
if (require.main === module) {
  runAllChecks()
    .then(() => process.exit(0))
    .catch((err: Error) => {
      console.error('\n' + err.message);
      process.exit(1);
    });
}

export { checkWindows, checkAdmin, checkPowerShell, checkCMSL, checkSubModules, runAllChecks };
