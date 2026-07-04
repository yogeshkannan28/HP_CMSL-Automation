import type { ZodRawShape } from 'zod';

/**
 * A single invocable operation backed by an existing POM module method.
 * Hand-written per module (see src/modules/*.meta.ts) — not reflected from
 * JSDoc, so the mutates flag is a deliberate human judgement call, not a guess.
 */
export interface ToolSpec {
  /** Unique tool name, e.g. 'bios_get_settings_list'. */
  name: string;
  /** POM module this tool belongs to, e.g. 'BiosDevice'. */
  module: string;
  /** Human-readable description surfaced to the LLM and MCP clients. */
  description: string;
  /** True if invoking this tool can change device/BIOS/dock/repo state. */
  mutates: boolean;
  /** zod raw shape describing the tool's arguments (empty object if none). */
  paramsSchema: ZodRawShape;
  /** Invokes the underlying POM module method with validated args. */
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

/** Normalized result returned by toolRegistry.invokeTool to all three consumers. */
export interface ToolResult {
  ok: boolean;
  output: string;
  raw: unknown;
}
