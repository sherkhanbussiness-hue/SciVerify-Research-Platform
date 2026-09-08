import { logger } from "../lib/logger";
import type { Fixture } from "./types";
import { createProvider } from "./providers/factory";
import type { GenerateOptions } from "./providers/interface";

export interface AgentGeneration {
  code: string;
  model: string;
  /** Which provider produced this generation (e.g. "openai", "groq", "stub-agent") */
  provider: string;
  retrieval_used?: boolean;
  retrieved_context?: string[];
}

function stubEnabled(): boolean {
  return process.env["SCIVERIFY_STUB_AGENT"] === "1";
}

export async function generateCode(
  fixture: Fixture,
  options?: GenerateOptions,
): Promise<AgentGeneration> {
  const retrieval_used = Boolean(
    options?.retrievedContext && options.retrievedContext.trim().length > 0,
  );
  const retrieved_context = options?.retrievedContext
    ? options.retrievedContext.trim().split("\n").filter(Boolean)
    : undefined;

  if (stubEnabled()) {
    logger.info(
      { fixture_id: fixture.id },
      "agent runner using SCIVERIFY_STUB_AGENT=1 (deterministic physics solver, not a live LLM)",
    );
    return {
      code: fixture.stub_code,
      model: "stub-agent",
      provider: "stub-agent",
      retrieval_used,
      retrieved_context,
    };
  }

  const provider = createProvider();
  const { code, model } = await provider.generate(fixture, options);
  return {
    code,
    model,
    provider: provider.name,
    retrieval_used,
    retrieved_context,
  };
}
