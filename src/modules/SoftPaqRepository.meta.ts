import { z } from 'zod';
import SoftPaqRepository from './SoftPaqRepository';
import type { ToolSpec } from '../core/types';

export const softPaqRepositoryTools: ToolSpec[] = [
  {
    name: 'softpaq_repo_initialize',
    module: 'SoftPaqRepository',
    mutates: true,
    description: 'Initialize a new SoftPaq repository at the given path (Initialize-Repository).',
    paramsSchema: { repoPath: z.string() },
    handler: (a) => SoftPaqRepository.initializeRepository(a.repoPath as string),
  },
  {
    name: 'softpaq_repo_add_filter',
    module: 'SoftPaqRepository',
    mutates: true,
    description: 'Add a SoftPaq filter (platform/os/category) to a repository (Add-RepositoryFilter).',
    paramsSchema: {
      repoPath: z.string(),
      platform: z.string(),
      os: z.string(),
      category: z.string().optional(),
    },
    handler: (a) =>
      SoftPaqRepository.addFilter(
        a.repoPath as string,
        a.platform as string,
        a.os as string,
        (a.category as string) ?? null
      ),
  },
  {
    name: 'softpaq_repo_sync',
    module: 'SoftPaqRepository',
    mutates: true,
    description: 'Sync a repository with the latest SoftPaqs (Invoke-RepositorySync). Slow — up to 5 min.',
    paramsSchema: { repoPath: z.string() },
    handler: (a) => SoftPaqRepository.syncRepository(a.repoPath as string),
  },
  {
    name: 'softpaq_repo_cleanup',
    module: 'SoftPaqRepository',
    mutates: true,
    description: 'Clean up obsolete SoftPaqs from a repository (Invoke-RepositoryCleanup).',
    paramsSchema: { repoPath: z.string() },
    handler: (a) => SoftPaqRepository.cleanupRepository(a.repoPath as string),
  },
  {
    name: 'softpaq_repo_get_info',
    module: 'SoftPaqRepository',
    mutates: false,
    description: 'Get repository configuration as parsed JSON (Get-RepositoryInfo).',
    paramsSchema: { repoPath: z.string() },
    handler: (a) => SoftPaqRepository.getRepositoryInfo(a.repoPath as string),
  },
];
