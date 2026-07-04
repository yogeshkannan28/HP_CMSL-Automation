import { z } from 'zod';
import BiosDevice from './BiosDevice';
import type { ToolSpec } from '../core/types';

export const biosDeviceTools: ToolSpec[] = [
  {
    name: 'bios_get_settings_list',
    module: 'BiosDevice',
    mutates: false,
    description: 'Get all BIOS settings as a list (Get-HPBIOSSettingsList).',
    paramsSchema: {},
    handler: () => BiosDevice.getSettingsList(),
  },
  {
    name: 'bios_get_setting_value',
    module: 'BiosDevice',
    mutates: false,
    description: 'Get a specific BIOS setting value by name (Get-HPBIOSSettingValue).',
    paramsSchema: { settingName: z.string() },
    handler: (a) => BiosDevice.getSettingValue(a.settingName as string),
  },
  {
    name: 'bios_set_setting',
    module: 'BiosDevice',
    mutates: true,
    description: 'Set a BIOS setting value, optionally with a BIOS setup password (Set-HPBIOSSetting).',
    paramsSchema: {
      settingName: z.string(),
      value: z.string(),
      password: z.string().optional(),
    },
    handler: (a) =>
      BiosDevice.setSetting(a.settingName as string, a.value as string, (a.password as string) ?? null),
  },
  {
    name: 'bios_get_device_details',
    module: 'BiosDevice',
    mutates: false,
    description: 'Get parsed device details: serial, product, model (Get-HPDeviceDetails).',
    paramsSchema: {},
    handler: () => BiosDevice.getDeviceDetails(),
  },
  {
    name: 'bios_get_serial_number',
    module: 'BiosDevice',
    mutates: false,
    description: 'Get device serial number (Get-HPDeviceSerialNumber).',
    paramsSchema: {},
    handler: () => BiosDevice.getSerialNumber(),
  },
  {
    name: 'bios_get_product_id',
    module: 'BiosDevice',
    mutates: false,
    description: 'Get device product ID (Get-HPDeviceProductID).',
    paramsSchema: {},
    handler: () => BiosDevice.getProductID(),
  },
  {
    name: 'bios_get_model',
    module: 'BiosDevice',
    mutates: false,
    description: 'Get device model name (Get-HPDeviceModel).',
    paramsSchema: {},
    handler: () => BiosDevice.getModel(),
  },
  {
    name: 'bios_get_bios_version',
    module: 'BiosDevice',
    mutates: false,
    description: 'Get BIOS version information (Get-HPBIOSVersion).',
    paramsSchema: {},
    handler: () => BiosDevice.getBiosVersion(),
  },
  {
    name: 'bios_setting_exists',
    module: 'BiosDevice',
    mutates: false,
    description: 'Check whether a BIOS setting exists by name.',
    paramsSchema: { settingName: z.string() },
    handler: (a) => BiosDevice.settingExists(a.settingName as string),
  },
];
