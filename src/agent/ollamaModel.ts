import { ChatOllama } from '@langchain/ollama';
import settings from '../../config/settings';

/**
 * Constructs the Ollama chat model used by the SDET agent. Kept to just the
 * well-established ChatOllama constructor fields (baseUrl/model) — per-call
 * timeout is applied at the AgentExecutor/fetch level instead of guessing at
 * a constructor option that may not exist across @langchain/ollama versions.
 */
export function createOllamaModel(): ChatOllama {
  return new ChatOllama({
    baseUrl: settings.ollama.baseUrl,
    model: settings.ollama.model,
  });
}
