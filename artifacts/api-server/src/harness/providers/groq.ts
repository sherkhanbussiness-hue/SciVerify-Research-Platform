import { logger } from "../../lib/logger";
import type { Fixture } from "../types";
import type { CodeGenerationProvider, GenerateOptions } from "./interface";

// ── shared helper ──────────────────────────────────────────────────────────────
function extractPython(text: string): string {
  const fenced = text.match(/```(?:python)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return text.trim();
}

// ── Groq provider ──────────────────────────────────────────────────────────────
// Groq exposes an OpenAI-compatible REST API, so we can reuse the same fetch
// pattern with a different base URL and key env variable.
// No new npm packages are needed.
export class GroqProvider implements CodeGenerationProvider {
  readonly name = "groq";

  async generate(fixture: Fixture, options?: GenerateOptions): Promise<{ code: string; model: string }> {
    const apiKey = process.env["GROQ_API_KEY"];
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY is not set. Add it to .env, or set AGENT_PROVIDER=openai to use OpenAI instead.",
      );
    }

    const baseUrl = (process.env["GROQ_BASE_URL"] ?? "https://api.groq.com/openai/v1").replace(/\/+$/, "");
    // llama-3.1-8b-instant is free-tier; override with GROQ_MODEL.
    const model = process.env["GROQ_MODEL"] ?? "llama-3.1-8b-instant";

    const body = {
      model,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            'You write only Python 3. Return a complete script. The last line of stdout must be JSON: {"value": <number>, "confidence": <integer 0-100>} where confidence is your self-assessed probability (0=certain wrong, 100=certain correct). No markdown unless you wrap the script in a python fence.',
        },
        {
          role: "user",
          content: `${fixture.prompt}\n\ninput_data JSON:\n${JSON.stringify(fixture.input_data)}${options?.retrievedContext ?? ""}`,
        },
      ],
    };

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const detail = await response.text();
      logger.error(
        { fixture_id: fixture.id, status: response.status, detail: detail.slice(0, 500), provider: "groq" },
        "groq provider: LLM request failed",
      );
      throw new Error(`Groq request failed (${response.status}): ${detail.slice(0, 300)}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content?.trim()) {
      throw new Error("Groq returned an empty completion");
    }

    const code = extractPython(content);
    if (!code) {
      throw new Error("Groq completion contained no Python code");
    }

    logger.info({ fixture_id: fixture.id, model, code_chars: code.length, provider: "groq" }, "groq provider generated code");
    return { code, model };
  }
}
