import Firmware from './Firmware';
import type { ToolSpec } from '../core/types';

export const firmwareTools: ToolSpec[] = [
  {
    name: 'firmware_get_audit_log',
    module: 'Firmware',
    mutates: false,
    description: 'Get current firmware/BIOS audit log (Get-HPFirmwareAuditLog).',
    paramsSchema: {},
    handler: () => Firmware.getAuditLog(),
  },
  {
    name: 'firmware_get_update_history',
    module: 'Firmware',
    mutates: false,
    description: 'Get firmware update status/history as parsed JSON.',
    paramsSchema: {},
    handler: () => Firmware.getUpdateHistory(),
  },
  {
    name: 'firmware_get_sure_start_audit_log',
    module: 'Firmware',
    mutates: false,
    description: 'Check if Sure Start is available/enabled (platform-dependent, Get-HPSureStartAuditLog).',
    paramsSchema: {},
    handler: () => Firmware.getSureStartAuditLog(),
  },
  {
    name: 'firmware_get_tpm_info',
    module: 'Firmware',
    mutates: false,
    description: 'Get TPM firmware info via audit log filter.',
    paramsSchema: {},
    handler: () => Firmware.getTPMInfo(),
  },
];
