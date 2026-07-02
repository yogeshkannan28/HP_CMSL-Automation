#!/usr/bin/env node
/**
 * lint-ps-strings.js — guards against unescaped PowerShell string interpolation.
 *
 * Flags template literals in src/modules/**\/*.ts that interpolate a variable
 * directly inside a single-quoted PowerShell argument (e.g. `-Name '${x}'`)
 * without going through psQuoteArg()/psQuoteSingle()/psAssertSafe(). This is a
 * lint gate, not a runtime guard — belt-and-suspenders with
 * tests/unit/psQuote.test.ts, which verifies the escaping itself is correct.
 *
 * Exit code 1 and a list of offending file:line matches on failure.
 */
const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, '..', 'src', 'modules');
// Matches: '${...}'  or  "${...}"  where the interpolation is NOT already
// wrapped by psQuoteArg(/psQuoteSingle(/psAssertSafe(
const RAW_INTERPOLATION_IN_QUOTES = /'\$\{(?!psQuoteArg\(|psQuoteSingle\(|psAssertSafe\()[^}]*\}'/g;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && full.endsWith('.ts') && !full.endsWith('.meta.ts')) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  if (!fs.existsSync(MODULES_DIR)) {
    console.log('lint-ps-strings: src/modules not found yet, skipping.');
    return 0;
  }

  const offenses = [];
  for (const file of walk(MODULES_DIR)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const matches = line.match(RAW_INTERPOLATION_IN_QUOTES);
      if (matches) {
        offenses.push(`${path.relative(process.cwd(), file)}:${idx + 1}: ${line.trim()}`);
      }
    });
  }

  if (offenses.length > 0) {
    console.error('\n❌ Unescaped PowerShell interpolation found (use psQuoteArg()):\n');
    offenses.forEach((o) => console.error('  ' + o));
    console.error(`\n${offenses.length} offense(s). See src/core/psQuote.ts.\n`);
    return 1;
  }

  console.log('✅ lint-ps-strings: no raw PowerShell interpolation found.');
  return 0;
}

process.exit(main());
