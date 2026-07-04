/**
 * server.ts — MCP server exposing the same tool registry the Ollama agent
 * uses, over stdio (the standard local transport, matching this project's
 * existing local/Administrator-trust model — no remote transport/auth in
 * v1). Registers one MCP tool per ToolSpec (invokeTool() is reused verbatim,
 * so hardware-lock safety for mutating tools is inherited for free) plus two
 * framework-level tools: run_test_suite and get_last_report.
 *
 * Note: the exact @modelcontextprotocol/sdk API surface used below
 * (`McpServer` + `.tool()`) should be confirmed against whatever version
 * `npm install` actually resolves for the `^1.0.4` range declared in
 * package.json, since the SDK isn't installed in this checkout yet.
 */
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import settings from '../../config/settings';
import { listTools, invokeTool } from '../core/toolRegistry';

const execFileAsync = promisify(execFile);

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

type SimpleToolCallback = (args: Record<string, unknown>) => Promise<{ content: Array<{ type: 'text'; text: string }> }>;
type SimpleToolRegistrar = (name: string, description: string, paramsSchema: z.ZodRawShape, cb: SimpleToolCallback) => void;

/**
 * McpServer.tool()'s real signature is generic over the exact zod shape of
 * paramsSchema. Since every ToolSpec's paramsSchema is a generic ZodRawShape
 * (not a per-call literal shape), calling the real overload once per
 * registered tool (~40 tools) blows up into "Type instantiation is
 * excessively deep and possibly infinite" (TS2589) and exhausts the
 * compiler's heap — the same failure mode as DynamicStructuredTool in
 * src/agent/tools.ts, fixed the same way: route through a narrow,
 * non-generic function type instead of the SDK's own generic overloads.
 */
function asSimpleToolRegistrar(server: McpServer): SimpleToolRegistrar {
  return server.tool.bind(server) as unknown as SimpleToolRegistrar;
}

function registerRegistryTools(server: McpServer): void {
  const registerTool = asSimpleToolRegistrar(server);
  for (const spec of listTools()) {
    registerTool(spec.name, spec.description, spec.paramsSchema, async (args) => {
      try {
        const result = await invokeTool(spec.name, args);
        return textResult(`${result.ok ? 'OK' : 'FAILED'}: ${result.output}`);
      } catch (err) {
        return textResult(`ERROR: ${(err as Error).message}`);
      }
    });
  }
}

function registerFrameworkTools(server: McpServer): void {
  const registerTool = asSimpleToolRegistrar(server);

  registerTool(
    'run_test_suite',
    'Run the HP CMSL test suite (readonly and/or mutating), optionally filtered to one module test directory (e.g. "tests/bios-device").',
    {
      testPathPattern: z.string().optional(),
      includeMutating: z.boolean().optional(),
    },
    async (args) => {
      const testPathPattern = args.testPathPattern as string | undefined;
      const includeMutating = Boolean(args.includeMutating);
      const runs: string[] = [];
      const configs = includeMutating
        ? ['jest.readonly.config.ts', 'jest.mutating.config.ts']
        : ['jest.readonly.config.ts'];

      for (const config of configs) {
        const jestArgs = ['jest', '--config', config];
        if (testPathPattern) jestArgs.push('--testPathPattern', testPathPattern);
        try {
          await execFileAsync('npx', jestArgs, { cwd: process.cwd() });
          runs.push(`${config}: PASSED`);
        } catch (err) {
          runs.push(`${config}: FAILED (${(err as Error).message})`);
        }
      }

      return textResult(runs.join('\n'));
    }
  );

  registerTool(
    'get_last_report',
    'Read the most recent reports/test-results.json produced by the custom Jest reporter.',
    {},
    async () => {
      const reportPath = path.join(settings.reports.outputDir, settings.reports.jsonFileName);
      if (!fs.existsSync(reportPath)) {
        return textResult(`No report found at ${reportPath}. Run a test suite first.`);
      }
      return textResult(fs.readFileSync(reportPath, 'utf8'));
    }
  );
}

async function main(): Promise<void> {
  const server = new McpServer({ name: 'hp-cmsl-automation', version: '2.0.0' });

  registerRegistryTools(server);
  registerFrameworkTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('HP CMSL Automation MCP server running on stdio.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
