import { z } from 'zod';
import SoftPaqManagement from './SoftPaqManagement';
import type { ToolSpec } from '../core/types';

export const softPaqManagementTools: ToolSpec[] = [
  {
    name: 'softpaq_get_list',
    module: 'SoftPaqManagement',
    mutates: false,
    description: 'Get list of available SoftPaqs for current platform, with optional platform/os/category filters (Get-SoftpaqList).',
    paramsSchema: {
      platform: z.string().optional(),
      os: z.string().optional(),
      category: z.string().optional(),
    },
    handler: (a) =>
      SoftPaqManagement.getSoftPaqList({
        platform: a.platform as string | undefined,
        os: a.os as string | undefined,
        category: a.category as string | undefined,
      }),
  },
  {
    name: 'softpaq_get_metadata',
    module: 'SoftPaqManagement',
    mutates: false,
    description: 'Get metadata for a specific SoftPaq by ID as parsed JSON (Get-Softpaq).',
    paramsSchema: { softpaqId: z.string() },
    handler: (a) => SoftPaqManagement.getSoftPaqMetadata(a.softpaqId as string),
  },
  {
    name: 'softpaq_download',
    module: 'SoftPaqManagement',
    mutates: true,
    description: 'Download and silently install a specific SoftPaq (Get-Softpaq). Slow — up to 2 min.',
    paramsSchema: {
      softpaqId: z.string(),
      destinationPath: z.string(),
      overwrite: z.boolean().optional(),
    },
    handler: (a) =>
      SoftPaqManagement.downloadSoftPaq(
        a.softpaqId as string,
        a.destinationPath as string,
        Boolean(a.overwrite)
      ),
  },
  {
    name: 'softpaq_get_latest_bios',
    module: 'SoftPaqManagement',
    mutates: false,
    description: 'Get the latest available BIOS SoftPaq for the current platform.',
    paramsSchema: {},
    handler: () => SoftPaqManagement.getLatestBIOS(),
  },
];
