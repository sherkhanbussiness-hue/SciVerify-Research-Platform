import { logger } from "../../lib/logger";
import type { CodeGenerationProvider } from "./interface";
import { OpenAIProvider } from "./openai";
import { GroqProvider } from "./groq";

/**
 * Factory that reads the AGENT_PROVIDER env-var and returns the matching
 * CodeGenerationProvider.
 *
 * Supported values (case-insensitive):
 *   openai  → OpenAIProvider  (default)
 *   groq    → GroqProvider
 *
 * If SCIVERIFY_STUB_AGENT=1 the caller in agent.ts short-circuits before
 * reaching this factory, so no stub provider is needed here.
 */
export function createProvider(): CodeGenerationProvider {
  const raw = (process.env["AGENT_PROVIDER"] ?? "openai").toLowerCase().trim();

  switch (raw) {
    case "groq": {
      logger.info({ provider: "groq" }, "provider factory: using Groq provider");
      return new GroqProvider();
    }
    case "openai":
    default: {
      logger.info({ provider: "openai" }, "provider factory: using OpenAI provider");
      return new OpenAIProvider();
    }
  }
}
