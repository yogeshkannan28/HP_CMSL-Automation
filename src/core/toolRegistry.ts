/**
 * toolRegistry.ts — the single choke point every consumer (Jest helpers if
 * they ever want it, the LangChain/Ollama agent, and the MCP server) calls
 * through to invoke a POM module method by name. Mutation-safety
 * (withHardwareLock) is applied generically here for any `mutates: true`
 * spec, so individual POM methods never need to know about locking.
 */
import { z } from 'zod';
import type { ToolSpec, ToolResult } from './types';
import { withHardwareLock } from './hardwareLock';

import { biosDeviceTools } from '../modules/BiosDevice.meta';
import { consentTools } from '../modules/Consent.meta';
import { docksTools } from '../modules/Docks.meta';
import { firmwareTools } from '../modules/Firmware.meta';
import { notificationsTools } from '../modules/Notifications.meta';
import { retailTools } from '../modules/Retail.meta';
import { softPaqManagementTools } from '../modules/SoftPaqManagement.meta';
import { softPaqRepositoryTools } from '../modules/SoftPaqRepository.meta';

const ALL_SPECS: ToolSpec[] = [
  ...biosDeviceTools,
  ...consentTools,
  ...docksTools,
  ...firmwareTools,
  ...notificationsTools,
  ...retailTools,
  ...softPaqManagementTools,
  ...softPaqRepositoryTools,
];

const registry = new Map<string, ToolSpec>();
for (const spec of ALL_SPECS) {
  if (registry.has(spec.name)) {
    throw new Error(`Duplicate tool name registered: ${spec.name}`);
  }
  registry.set(spec.name, spec);
}

export function listTools(): ToolSpec[] {
  return [...registry.values()];
}

export function getTool(name: string): ToolSpec | undefined {
  return registry.get(name);
}

/** Best-effort stringification for the ToolResult.output field. */
function stringifyOutput(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.stdout === 'string') return obj.stdout;
    if ('data' in obj) {
      try {
        return JSON.stringify(obj.data);
      } catch {
        /* fall through to generic JSON below */
      }
    }
  }
  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

function isSuccessful(raw: unknown): boolean {
  if (raw && typeof raw === 'object' && 'success' in (raw as Record<string, unknown>)) {
    return Boolean((raw as Record<string, unknown>).success);
  }
  return true;
}

export async function invokeTool(name: string, args: Record<string, unknown> = {}): Promise<ToolResult> {
  const spec = registry.get(name);
  if (!spec) {
    throw new Error(`Unknown tool: ${name}. Known tools: ${[...registry.keys()].join(', ')}`);
  }

  const parsed = z.object(spec.paramsSchema).parse(args);
  const run = () => spec.handler(parsed);
  const raw = spec.mutates ? await withHardwareLock(run) : await run();

  return {
    ok: isSuccessful(raw),
    output: stringifyOutput(raw),
    raw,
  };
}
