import { validatePatch } from '../../src/agent/patchGuard';

describe('patchGuard', () => {
  it('accepts a diff touching only an allowed src/modules file', () => {
    const diff =
      'diff --git a/src/modules/BiosDevice.js b/src/modules/BiosDevice.js\n' +
      '--- a/src/modules/BiosDevice.js\n' +
      '+++ b/src/modules/BiosDevice.js\n' +
      '@@ -1,1 +1,1 @@\n' +
      '-old line\n' +
      '+new line\n';

    const result = validatePatch(diff);
    expect(result.ok).toBe(true);
    expect(result.files).toEqual(['src/modules/BiosDevice.js']);
  });

  it('accepts a diff touching an allowed tests/ file', () => {
    const diff =
      'diff --git a/tests/bios-device/bios-device.test.js b/tests/bios-device/bios-device.test.js\n' +
      '--- a/tests/bios-device/bios-device.test.js\n' +
      '+++ b/tests/bios-device/bios-device.test.js\n' +
      '@@ -1,1 +1,1 @@\n' +
      '-old\n' +
      '+new\n';

    const result = validatePatch(diff);
    expect(result.ok).toBe(true);
  });

  it('rejects a diff touching a file outside the allowlist', () => {
    const diff =
      'diff --git a/package.json b/package.json\n' +
      '--- a/package.json\n' +
      '+++ b/package.json\n' +
      '@@ -1,1 +1,1 @@\n' +
      '-old\n' +
      '+new\n';

    const result = validatePatch(diff);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/outside the allowed patch directories/);
  });

  it('rejects a diff with no recognizable file headers', () => {
    const result = validatePatch('not a real diff at all');
    expect(result.ok).toBe(false);
  });

  it('rejects a diff exceeding the max changed line count', () => {
    const manyLines = Array.from({ length: 250 }, (_, i) => `+line ${i}`).join('\n');
    const diff =
      'diff --git a/tests/unit/foo.test.ts b/tests/unit/foo.test.ts\n' +
      '--- a/tests/unit/foo.test.ts\n' +
      '+++ b/tests/unit/foo.test.ts\n' +
      '@@ -1,1 +1,250 @@\n' +
      `${manyLines}\n`;

    const result = validatePatch(diff);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/exceeds max/);
  });

  it('rejects a diff touching more files than maxPatchFiles allows', () => {
    const diff =
      'diff --git a/src/modules/A.js b/src/modules/A.js\n' +
      '--- a/src/modules/A.js\n' +
      '+++ b/src/modules/A.js\n' +
      '@@ -1,1 +1,1 @@\n' +
      '-a\n' +
      '+b\n' +
      'diff --git a/src/modules/B.js b/src/modules/B.js\n' +
      '--- a/src/modules/B.js\n' +
      '+++ b/src/modules/B.js\n' +
      '@@ -1,1 +1,1 @@\n' +
      '-a\n' +
      '+b\n';

    const result = validatePatch(diff);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/exceeds max of 1/);
  });
});
