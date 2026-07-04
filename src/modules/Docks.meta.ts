import Docks from './Docks';
import type { ToolSpec } from '../core/types';

export const docksTools: ToolSpec[] = [
  {
    name: 'docks_get_info',
    module: 'Docks',
    mutates: false,
    description: 'Get connected dock information (Get-HPDockInfo).',
    paramsSchema: {},
    handler: () => Docks.getDockInfo(),
  },
  {
    name: 'docks_get_info_json',
    module: 'Docks',
    mutates: false,
    description: 'Get connected dock information as parsed JSON.',
    paramsSchema: {},
    handler: () => Docks.getDockInfoJson(),
  },
  {
    name: 'docks_get_update_details',
    module: 'Docks',
    mutates: false,
    description: 'Get dock firmware update availability (Get-HPDockUpdateDetails).',
    paramsSchema: {},
    handler: () => Docks.getUpdateDetails(),
  },
  {
    name: 'docks_update_firmware',
    module: 'Docks',
    mutates: true,
    description: 'Update dock firmware (Update-HPDockFirmware). Flashes real hardware — slow (up to 5 min).',
    paramsSchema: {},
    handler: () => Docks.updateFirmware(),
  },
  {
    name: 'docks_verify_module_loaded',
    module: 'Docks',
    mutates: false,
    description: 'Verify the HP.Docks module loads correctly.',
    paramsSchema: {},
    handler: () => Docks.verifyModuleLoaded(),
  },
];
