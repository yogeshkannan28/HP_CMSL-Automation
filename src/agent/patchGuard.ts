import settings from '../../config/settings';

/**
 * Hard-coded diff validator — never trusts the model. Rejects any unified
 * diff touching paths outside settings.agent.allowedPatchDirs, or exceeding
 * the configured file/line caps. This is the actual safety property of the
 * fix loop; the model's own judgement about what's safe to touch is not
 * relied on at all.
 */
export interface PatchGuardResult {
  ok: boolean;
  reason?: string;
  files: string[];
  changedLines: number;
}

const FILE_HEADER_RE = /^\+\+\+ b\/(.+)$/gm;

function isWithinAllowedDirs(file: string): boolean {
  const normalized = file.split('\\').join('/');
  return settings.agent.allowedPatchDirs.some((dir) => {
    const normalizedDir = dir.replace(/\/$/, '');
    return normalized === normalizedDir || normalized.startsWith(`${normalizedDir}/`);
  });
}

export function validatePatch(diff: string): PatchGuardResult {
  const files = new Set<string>();
  const re = new RegExp(FILE_HEADER_RE);
  let match: RegExpExecArray | null;
  while ((match = re.exec(diff)) !== null) {
    const file = match[1].trim();
    if (file !== '/dev/null') files.add(file);
  }
  const fileList = [...files];

  if (fileList.length === 0) {
    return {
      ok: false,
      reason: 'Diff does not touch any files (no "+++ b/..." header found).',
      files: fileList,
      changedLines: 0,
    };
  }

  if (fileList.length > settings.agent.maxPatchFiles) {
    return {
      ok: false,
      reason: `Diff touches ${fileList.length} file(s), exceeds max of ${settings.agent.maxPatchFiles}.`,
      files: fileList,
      changedLines: 0,
    };
  }

  for (const file of fileList) {
    if (!isWithinAllowedDirs(file)) {
      return {
        ok: false,
        reason: `File "${file}" is outside the allowed patch directories: ${settings.agent.allowedPatchDirs.join(', ')}`,
        files: fileList,
        changedLines: 0,
      };
    }
  }

  const changedLines = diff
    .split('\n')
    .filter(
      (line) =>
        (line.startsWith('+') && !line.startsWith('+++')) || (line.startsWith('-') && !line.startsWith('---'))
    ).length;

  if (changedLines > settings.agent.maxPatchLines) {
    return {
      ok: false,
      reason: `Diff changes ${changedLines} line(s), exceeds max of ${settings.agent.maxPatchLines}.`,
      files: fileList,
      changedLines,
    };
  }

  return { ok: true, files: fileList, changedLines };
}
