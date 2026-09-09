import { logger } from "../../lib/logger";
import type { Fixture } from "../types";
import type { CodeGenerationProvider, GenerateOptions } from "./interface";

import { sanitizeString } from "../../lib/sanitize";

// ── shared helper ──────────────────────────────────────────────────────────────
function extractPython(text: string): string {
  const fenced = text.match(/```(?:python)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return text.trim();
}

// ── OpenAI provider ────────────────────────────────────────────────────────────
export class OpenAIProvider implements CodeGenerationProvider {
  readonly name = "openai";

  async generate(fixture: Fixture, options?: GenerateOptions): Promise<{ code: string; model: string }> {
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. Add it to .env, or set SCIVERIFY_STUB_AGENT=1 for a deterministic local solver.",
      );
    }

    const baseUrl = (process.env["OPENAI_BASE_URL"] ?? "https://api.openai.com/v1").replace(/\/+$/, "");
    const model = process.env["OPENAI_MODEL"] ?? "gpt-4o-mini";

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
      const rawDetail = await response.text();
      const detail = sanitizeString(rawDetail);
      logger.error(
        { fixture_id: fixture.id, status: response.status, detail: detail.slice(0, 500), provider: "openai" },
        "openai provider: LLM request failed",
      );
      throw new Error(`OpenAI request failed (${response.status}): ${detail.slice(0, 300)}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content?.trim()) {
      throw new Error("OpenAI returned an empty completion");
    }

    const code = extractPython(content);
    if (!code) {
      throw new Error("OpenAI completion contained no Python code");
    }

    logger.info({ fixture_id: fixture.id, model, code_chars: code.length, provider: "openai" }, "openai provider generated code");
    return { code, model };
  }
}
