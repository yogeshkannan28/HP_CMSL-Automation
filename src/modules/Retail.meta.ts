import Retail from './Retail';
import type { ToolSpec } from '../core/types';

export const retailTools: ToolSpec[] = [
  {
    name: 'retail_get_device_info',
    module: 'Retail',
    mutates: false,
    description: 'Get retail device information (Get-HPRetailDeviceInfo).',
    paramsSchema: {},
    handler: () => Retail.getRetailDeviceInfo(),
  },
  {
    name: 'retail_get_device_info_json',
    module: 'Retail',
    mutates: false,
    description: 'Get retail device info as parsed JSON.',
    paramsSchema: {},
    handler: () => Retail.getRetailDeviceInfoJson(),
  },
  {
    name: 'retail_get_configuration',
    module: 'Retail',
    mutates: false,
    description: 'Get retail device configuration (Get-HPRetailConfiguration).',
    paramsSchema: {},
    handler: () => Retail.getConfiguration(),
  },
  {
    name: 'retail_verify_module_loaded',
    module: 'Retail',
    mutates: false,
    description: 'Verify the HP.Retail module loads correctly.',
    paramsSchema: {},
    handler: () => Retail.verifyModuleLoaded(),
  },
];
