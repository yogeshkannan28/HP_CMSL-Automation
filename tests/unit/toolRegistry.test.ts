jest.mock('../../src/helpers/psRunner', () => ({
  runCommand: jest.fn().mockResolvedValue({ stdout: 'ok', stderr: '', exitCode: 0, success: true, duration: 1 }),
  runCommandJson: jest.fn().mockResolvedValue({ data: {}, raw: {} }),
  runCMSLCommand: jest.fn().mockResolvedValue({ stdout: 'ok', stderr: '', exitCode: 0, success: true, duration: 1 }),
  runCMSLCommandJson: jest.fn().mockResolvedValue({ data: {}, raw: {} }),
  setPool: jest.fn(),
  getPool: jest.fn(),
}));

jest.mock('../../src/core/hardwareLock', () => ({
  withHardwareLock: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

import { invokeTool, listTools } from '../../src/core/toolRegistry';
import { withHardwareLock } from '../../src/core/hardwareLock';

describe('toolRegistry', () => {
  beforeEach(() => {
    (withHardwareLock as jest.Mock).mockClear();
  });

  it('aggregates tool specs from every module with unique names', () => {
    const tools = listTools();
    expect(tools.length).toBeGreaterThan(30);
    expect(new Set(tools.map((t) => t.name)).size).toBe(tools.length);
  });

  it('invokes a read-only tool without the hardware lock', async () => {
    const result = await invokeTool('bios_get_settings_list', {});
    expect(result.ok).toBe(true);
    expect(withHardwareLock).not.toHaveBeenCalled();
  });

  it('invokes a mutating tool wrapped in the hardware lock', async () => {
    await invokeTool('bios_set_setting', { settingName: 'Foo', value: 'Bar' });
    expect(withHardwareLock).toHaveBeenCalledTimes(1);
  });

  it('validates params via zod and rejects missing required args', async () => {
    await expect(invokeTool('bios_get_setting_value', {})).rejects.toThrow();
  });

  it('throws a clear error for an unknown tool name', async () => {
    await expect(invokeTool('does_not_exist', {})).rejects.toThrow(/Unknown tool/);
  });
});
