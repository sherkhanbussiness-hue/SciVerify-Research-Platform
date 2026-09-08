import type { Fixture } from "../types";

/**
 * Optional parameters forwarded to a provider's generate() call.
 */
export interface GenerateOptions {
  /**
   * Formatted formula context injected into the user message.
   * When non-empty the provider appends it after the fixture prompt.
   */
  retrievedContext?: string;
}

/**
 * A CodeGenerationProvider is responsible for turning a Fixture into
 * executable Python code.  Each concrete provider wraps a different
 * LLM backend (OpenAI, Groq, stub, …) while exposing the same surface.
 */
export interface CodeGenerationProvider {
  /** Human-readable name that is stored in FixtureRunResult.provider */
  readonly name: string;

  /**
   * Generate Python code for the given fixture.
   * Returns the raw code string and the model identifier that was used.
   */
  generate(fixture: Fixture, options?: GenerateOptions): Promise<{ code: string; model: string }>;
}
