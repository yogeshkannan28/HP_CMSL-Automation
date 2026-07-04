/**
 * Builds the PowerShell source for one persistent pool worker.
 *
 * Written to a temp .ps1 file at spawn time (see psPool.ts) and run via
 * `pwsh -File`, not piped in via `-Command -` — the latter reads its entire
 * script from stdin until EOF before executing anything, which would starve
 * the NDJSON request loop below of a stdin it can still read from. Using
 * `-File` keeps stdin free for the request/response protocol while still
 * keeping the whole worker authored as one TS-owned template string (no
 * checked-in .ps1, no CI path resolution surprises — only a throwaway
 * runtime artifact).
 *
 * Protocol: one JSON line in on stdin (`{"id": "...", "command": "..."}`),
 * one JSON line out on stdout (`{"id", "stdoutB64", "stderrB64",
 * "exitCode"}` — base64-encoded so embedded newlines in command output can't
 * break the line-per-message framing). A `{"ready":true}` line is emitted
 * once after startup module imports finish, before the loop starts reading
 * requests, so psPool.ts knows when the worker can accept work.
 */
export function buildWorkerScript(cmslModules: string[]): string {
  const moduleList = cmslModules.map((m) => `'${m.replace(/'/g, "''")}'`).join(', ');

  return `
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
$InformationPreference = 'SilentlyContinue'

foreach ($m in @(${moduleList})) {
  try {
    Import-Module $m -ErrorAction Stop
  } catch {
    [Console]::Error.WriteLine("WARN: failed to import $m: $($_.Exception.Message)")
  }
}

$readyLine = [PSCustomObject]@{ ready = $true } | ConvertTo-Json -Compress
[Console]::Out.WriteLine($readyLine)
[Console]::Out.Flush()

while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  if ($line.Trim().Length -eq 0) { continue }

  try {
    $req = $line | ConvertFrom-Json
  } catch {
    continue
  }

  $Error.Clear()
  $exitCode = 0
  $stdoutText = ''
  $stderrText = ''

  try {
    $stdoutText = (Invoke-Expression $req.command | Out-String)
    if ($Error.Count -gt 0) {
      $stderrText = (($Error | ForEach-Object { $_.Exception.Message }) -join "\`n")
    }
  } catch {
    $stdoutText = ''
    $stderrText = $_.Exception.Message
    $exitCode = 1
  }

  $stdoutBytes = [Text.Encoding]::UTF8.GetBytes([string]$stdoutText)
  $stderrBytes = [Text.Encoding]::UTF8.GetBytes([string]$stderrText)

  $resp = [PSCustomObject]@{
    id        = $req.id
    stdoutB64 = [Convert]::ToBase64String($stdoutBytes)
    stderrB64 = [Convert]::ToBase64String($stderrBytes)
    exitCode  = $exitCode
  }

  [Console]::Out.WriteLine(($resp | ConvertTo-Json -Compress))
  [Console]::Out.Flush()
}
`;
}
