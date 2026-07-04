/**
 * settings.ts — Central configuration for HP CMSL Automation
 *
 * Modify these values based on your environment. This is the ONLY file you
 * should need to change per machine. Validated with zod at load time so a
 * bad value fails fast here instead of surfacing as a confusing spawn error.
 */
import path from 'path';
import { z } from 'zod';

const FrameworkConfigSchema = z.object({
  powershell: z.object({
    executable: z.string().default('pwsh.exe'),
    fallbackExecutable: z.string().default('powershell.exe'),
    defaultTimeout: z.number().int().positive().default(30000),
    executionPolicy: z.string().default('Bypass'),
    /** Number of persistent pwsh.exe workers in the read-only pool. */
    poolSize: z.number().int().min(1).max(16).default(4),
    /** How long a worker may sit idle mid-command before it's considered hung. */
    workerCommandTimeout: z.number().int().positive().default(60000),
  }),

  cmsl: z.object({
    moduleName: z.string().default('HPCMSL'),
    minimumVersion: z.string().nullable().default(null),
    modules: z.array(z.string()).default([
      'HP.Private',
      'HP.ClientManagement',
      'HP.Firmware',
      'HP.Retail',
      'HP.Consent',
      'HP.Notifications',
      'HP.Docks',
      'HP.Sinks',
      'HP.Softpaq',
      'HP.Repo',
    ]),
  }),

  reports: z.object({
    outputDir: z.string().default(path.join(__dirname, '..', 'reports')),
    jsonFileName: z.string().default('test-results.json'),
    htmlFileName: z.string().default('test-report.html'),
    agentFixesDir: z.string().default(path.join(__dirname, '..', 'reports', 'agent-fixes')),
  }),

  platform: z.object({
    os: z.string().default(process.platform),
    arch: z.string().default(process.arch),
    nodeVersion: z.string().default(process.version),
  }),

  hardwareLock: z.object({
    lockFilePath: z.string().default(path.join(__dirname, '..', '.locks', 'hp-hardware.lock')),
    staleTimeoutMs: z.number().int().positive().default(10 * 60 * 1000),
    retryCount: z.number().int().min(0).default(20),
    retryMinTimeoutMs: z.number().int().positive().default(500),
  }),

  ollama: z.object({
    baseUrl: z.string().default(process.env.OLLAMA_BASE_URL || 'http://localhost:11434'),
    model: z.string().default(process.env.OLLAMA_MODEL || 'qwen2.5-coder:14b'),
    maxTurns: z.number().int().positive().default(12),
    maxToolResultChars: z.number().int().positive().default(4000),
    requestTimeoutMs: z.number().int().positive().default(120000),
  }),

  agent: z.object({
    fixLoopEnabled: z.boolean().default(true),
    maxFixAttemptsPerFailure: z.number().int().min(0).default(1),
    allowedPatchDirs: z.array(z.string()).default(['src/modules', 'tests']),
    maxPatchFiles: z.number().int().positive().default(1),
    maxPatchLines: z.number().int().positive().default(200),
  }),
});

export type FrameworkConfig = z.infer<typeof FrameworkConfigSchema>;

const rawConfig: z.input<typeof FrameworkConfigSchema> = {
  powershell: {},
  cmsl: {},
  reports: {},
  platform: {},
  hardwareLock: {},
  ollama: {},
  agent: {},
};

function loadConfig(): FrameworkConfig {
  const result = FrameworkConfigSchema.safeParse(rawConfig);
  if (!result.success) {
    throw new Error(
      `Invalid framework configuration in config/settings.ts:\n${result.error.toString()}`
    );
  }
  return result.data;
}

const settings = loadConfig();

export default settings;
