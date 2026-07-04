import { DynamicStructuredTool, StructuredToolInterface } from '@langchain/core/tools';
import { z } from 'zod';
import settings from '../../config/settings';
import { listTools, invokeTool } from '../core/toolRegistry';

interface SimpleToolConfig {
  name: string;
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  func: (input: Record<string, unknown>) => Promise<string>;
}

/**
 * DynamicStructuredTool's real constructor is generic over the exact zod
 * shape. Our paramsSchema is a generic ZodRawShape (not a per-call literal
 * shape), so letting TS infer the class's own generics from it — once per
 * tool, across ~40 tools — blows up into "Type instantiation is excessively
 * deep and possibly infinite" (TS2589) and exhausts the compiler's heap.
 * Constructing through this narrow, non-generic constructor type sidesteps
 * that inference entirely while still building a real DynamicStructuredTool
 * instance at runtime.
 */
const buildTool: new (config: SimpleToolConfig) => StructuredToolInterface =
  DynamicStructuredTool as unknown as new (config: SimpleToolConfig) => StructuredToolInterface;

/**
 * Converts every registered ToolSpec (src/core/toolRegistry.ts) into a
 * LangChain tool the agent can call. Hardware-lock safety for mutating tools
 * is inherited for free since this goes through invokeTool(), not the POM
 * module methods directly.
 */
export function buildAgentTools(): StructuredToolInterface[] {
  return listTools().map((spec): StructuredToolInterface => {
    const schema = z.object(spec.paramsSchema);

    const runTool = async (input: Record<string, unknown>): Promise<string> => {
      const result = await invokeTool(spec.name, input);
      const text = result.output;
      const truncated =
        text.length > settings.ollama.maxToolResultChars
          ? `${text.slice(0, settings.ollama.maxToolResultChars)}\n...[truncated]`
          : text;
      return `${result.ok ? 'OK' : 'FAILED'}: ${truncated}`;
    };

    return new buildTool({
      name: spec.name,
      description: `${spec.description} ${spec.mutates ? '(MUTATES real device/hardware state)' : '(read-only)'}`,
      schema,
      func: runTool,
    });
  });
}
