import { AgentExecutor, createStructuredChatAgent, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { StructuredToolInterface } from '@langchain/core/tools';
import type { ChatOllama } from '@langchain/ollama';
import settings from '../../config/settings';

/**
 * The SDET persona + the agent's ReAct loop, built on LangChain.js instead of
 * a hand-rolled ollamaClient/reactLoop (per project decision) — LangChain's
 * AgentExecutor owns the call-model -> run-tool -> append-result loop.
 *
 * Two construction paths:
 *  - createToolCallingAgent: native Ollama tool calling (e.g. qwen2.5-coder).
 *    Tried first since it's the default model family in config/settings.ts.
 *  - createStructuredChatAgent: prompt-based ReAct fallback for models
 *    without native tool-calling support. Only exercised if the tool-calling
 *    executor errors out at invoke time.
 */
const SDET_SYSTEM_PROMPT = `You are an automated SDET (Software Development Engineer in Test) monitoring \
the HP CMSL PowerShell test automation framework. Investigate failures the way a manual + automation \
engineer would: call the same read-only tools a human would call (settings, device details, audit logs, \
dock/repo info, etc.) before concluding whether a failure is a hardware/environment issue or a bug in the \
test script itself. Only call a mutating tool when the task explicitly requires changing device state, and \
always explain why first. When you conclude a failure is caused by a bug in a test script (not \
hardware/env), end your final answer with a line starting "SCRIPT_BUG:" naming the file and the reasoning, \
so the fix loop can act on it. Otherwise end with "ENV_ISSUE:" or "PASS:" as appropriate.`;

const TOOL_CALLING_PROMPT = ChatPromptTemplate.fromMessages([
  ['system', SDET_SYSTEM_PROMPT],
  ['human', '{input}'],
  ['placeholder', '{agent_scratchpad}'],
]);

const STRUCTURED_CHAT_PROMPT = ChatPromptTemplate.fromMessages([
  [
    'system',
    `${SDET_SYSTEM_PROMPT}\n\nYou have access to the following tools:\n\n{tools}\n\n` +
      'Respond with a JSON blob for the next action: {{"action": $TOOL_NAME, "action_input": $INPUT}}. ' +
      `Valid "action" values are one of [{tool_names}] or "Final Answer" once you have enough information.`,
  ],
  ['human', '{input}\n\n{agent_scratchpad}'],
]);

export interface ReactLoopResult {
  finalAnswer: string;
  verdict: 'PASS' | 'ENV_ISSUE' | 'SCRIPT_BUG' | 'UNKNOWN';
  transcript: unknown;
}

function extractVerdict(finalAnswer: string): ReactLoopResult['verdict'] {
  if (/SCRIPT_BUG:/i.test(finalAnswer)) return 'SCRIPT_BUG';
  if (/ENV_ISSUE:/i.test(finalAnswer)) return 'ENV_ISSUE';
  if (/PASS:/i.test(finalAnswer)) return 'PASS';
  return 'UNKNOWN';
}

async function buildToolCallingExecutor(
  llm: ChatOllama,
  tools: StructuredToolInterface[]
): Promise<AgentExecutor> {
  const agent = await createToolCallingAgent({ llm, tools, prompt: TOOL_CALLING_PROMPT });
  return new AgentExecutor({
    agent,
    tools,
    maxIterations: settings.ollama.maxTurns,
    returnIntermediateSteps: true,
  });
}

async function buildStructuredChatExecutor(
  llm: ChatOllama,
  tools: StructuredToolInterface[]
): Promise<AgentExecutor> {
  const agent = await createStructuredChatAgent({ llm, tools, prompt: STRUCTURED_CHAT_PROMPT });
  return new AgentExecutor({
    agent,
    tools,
    maxIterations: settings.ollama.maxTurns,
    returnIntermediateSteps: true,
  });
}

/**
 * Runs one investigation task through the agent. Tries native tool calling
 * first; if the model/Ollama server rejects the tools request (models
 * without function-calling support error at invoke time, not construction
 * time), falls back to the structured-chat ReAct prompt transparently.
 */
export async function runReactLoop(
  llm: ChatOllama,
  tools: StructuredToolInterface[],
  task: string
): Promise<ReactLoopResult> {
  const toolCallingExecutor = await buildToolCallingExecutor(llm, tools);

  // AgentExecutor.invoke() returns ChainValues (Record<string, any>) — its
  // shape isn't statically known to include `output`, so read it loosely
  // rather than assigning into a concretely-typed variable.
  let result: Record<string, unknown>;
  try {
    result = await toolCallingExecutor.invoke({ input: task });
  } catch (err) {
    console.warn(
      `Tool-calling agent failed (model may not support native tool calling), ` +
        `falling back to structured-chat ReAct mode: ${(err as Error).message}`
    );
    const structuredExecutor = await buildStructuredChatExecutor(llm, tools);
    result = await structuredExecutor.invoke({ input: task });
  }

  const finalAnswer = typeof result.output === 'string' ? result.output : '';
  return {
    finalAnswer,
    verdict: extractVerdict(finalAnswer),
    transcript: result.intermediateSteps ?? [],
  };
}
