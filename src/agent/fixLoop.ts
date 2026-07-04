import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import simpleGit, { SimpleGit } from 'simple-git';
import type { ChatOllama } from '@langchain/ollama';
import settings from '../../config/settings';
import { validatePatch } from './patchGuard';

const execFileAsync = promisify(execFile);

export interface FixLoopInput {
  module: string;
  testFilePath: string;
  /** Failure messages / investigation summary from the ReAct loop. */
  failureContext: string;
}

export interface FixLoopOutcome {
  attempted: boolean;
  success: boolean;
  branch?: string;
  reportPath?: string;
  reason?: string;
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function askModelForDiff(llm: ChatOllama, input: FixLoopInput): Promise<string> {
  const testSource = fs.readFileSync(input.testFilePath, 'utf8');
  const prompt =
    `You are fixing a bug in an HP CMSL test automation SCRIPT, not the underlying hardware/CMSL behavior. ` +
    `A test in module "${input.module}" is failing:\n\n${input.failureContext}\n\n` +
    `Current contents of ${input.testFilePath}:\n\n\`\`\`\n${testSource}\n\`\`\`\n\n` +
    `Respond with ONLY a unified diff (git apply compatible, paths relative to the repo root, prefixed ` +
    `a/ and b/) that fixes the test script bug. Do not touch any other file. No explanation text outside the diff.`;

  const response = await llm.invoke(prompt);
  const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
  const diffMatch = content.match(/```(?:diff)?\n([\s\S]*?)```/);
  return (diffMatch ? diffMatch[1] : content).trim();
}

async function rerunTestFile(testFilePath: string): Promise<boolean> {
  const isMutating = testFilePath.split(path.sep).join('/').includes('/mutating/');
  const config = isMutating ? 'jest.mutating.config.ts' : 'jest.readonly.config.ts';
  try {
    await execFileAsync('npx', ['jest', '--config', config, '--testPathPattern', testFilePath], {
      cwd: process.cwd(),
    });
    return true;
  } catch {
    return false;
  }
}

function writeReport(input: FixLoopInput, diff: string, branchName: string): string {
  const dir = settings.reports.agentFixesDir;
  fs.mkdirSync(dir, { recursive: true });
  const reportPath = path.join(dir, `${timestamp()}.md`);
  const content =
    `# Agent fix — ${input.module}\n\n` +
    `Branch: \`${branchName}\`\n\n` +
    `## Failure context\n\n${input.failureContext}\n\n` +
    `## Applied diff\n\n\`\`\`diff\n${diff}\n\`\`\`\n`;
  fs.writeFileSync(reportPath, content, 'utf8');
  return reportPath;
}

/**
 * Single fix attempt for one failure. Branch-isolated, path-allowlisted
 * (patchGuard), always reverted on a failed re-run, never pushes or merges,
 * never touches the branch the caller started on. Callers enforce
 * settings.agent.maxFixAttemptsPerFailure by deciding how many times to call
 * this per distinct failure — this function itself only ever makes one attempt.
 */
export async function runFixLoop(llm: ChatOllama, input: FixLoopInput): Promise<FixLoopOutcome> {
  if (!settings.agent.fixLoopEnabled) {
    return { attempted: false, success: false, reason: 'agent.fixLoopEnabled is false in config/settings.ts' };
  }

  const git: SimpleGit = simpleGit();
  const status = await git.status();
  const originalBranch = status.current ?? 'main';
  const branchName = `agent/fix-${input.module}-${timestamp()}`;

  const diff = await askModelForDiff(llm, input);
  const guard = validatePatch(diff);
  if (!guard.ok) {
    return { attempted: true, success: false, reason: `patchGuard rejected diff: ${guard.reason}` };
  }

  await git.checkoutLocalBranch(branchName);

  const patchPath = path.join(os.tmpdir(), `agent-fix-${Date.now()}.diff`);
  fs.writeFileSync(patchPath, diff.endsWith('\n') ? diff : `${diff}\n`, 'utf8');

  try {
    await execFileAsync('git', ['apply', patchPath]);
  } catch (err) {
    await git.checkout(originalBranch);
    await git.deleteLocalBranch(branchName, true);
    return { attempted: true, success: false, reason: `git apply failed: ${(err as Error).message}` };
  } finally {
    fs.unlinkSync(patchPath);
  }

  await git.add(guard.files);
  await git.commit(`agent: attempt fix for ${input.module} test failure`);

  const rerunPassed = await rerunTestFile(input.testFilePath);

  if (!rerunPassed) {
    await git.checkout(originalBranch);
    await git.deleteLocalBranch(branchName, true);
    return {
      attempted: true,
      success: false,
      branch: branchName,
      reason: 'Re-run of the affected test still failed after the patch; branch reverted.',
    };
  }

  const reportPath = writeReport(input, diff, branchName);
  await git.checkout(originalBranch);

  return { attempted: true, success: true, branch: branchName, reportPath };
}
