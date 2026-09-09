/**
 * Utilities for sanitizing sensitive credentials, database URLs, and API tokens
 * from logs, error messages, and API responses.
 */

const SENSITIVE_PATTERNS = [
  // OpenAI API keys
  /sk-[a-zA-Z0-9_\-]{16,}/g,
  // Groq API keys
  /gsk_[a-zA-Z0-9_\-]{16,}/g,
  // Database connection strings (PostgreSQL, MySQL, MongoDB, etc.)
  /(postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s"'<>]+/gi,
  // Authorization bearer tokens
  /Bearer\s+([a-zA-Z0-9_\-\.]{12,})/gi,
];

/**
 * Mask a sensitive token showing only its prefix and last 4 characters.
 */
export function maskToken(token: string): string {
  if (token.length <= 8) return "[REDACTED]";
  const prefix = token.slice(0, 4);
  const suffix = token.slice(-4);
  return `${prefix}...${suffix}`;
}

/**
 * Sanitize any string by replacing detected API keys, database URLs, or passwords.
 */
export function sanitizeString(text: string): string {
  if (!text || typeof text !== "string") return text;

  let sanitized = text;

  // Mask known env values if they exist in memory
  const envSecrets = [
    process.env["OPENAI_API_KEY"],
    process.env["GROQ_API_KEY"],
    process.env["DATABASE_URL"],
  ].filter((v): v is string => Boolean(v && v.trim().length > 6));

  for (const secret of envSecrets) {
    if (sanitized.includes(secret)) {
      sanitized = sanitized.split(secret).join(maskToken(secret));
    }
  }

  // Regex patterns
  sanitized = sanitized.replace(/sk-[a-zA-Z0-9_\-]{16,}/g, (match) => maskToken(match));
  sanitized = sanitized.replace(/gsk_[a-zA-Z0-9_\-]{16,}/g, (match) => maskToken(match));
  sanitized = sanitized.replace(
    /(postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s"'<>]+/gi,
    "[REDACTED_DATABASE_URL]"
  );
  sanitized = sanitized.replace(/Bearer\s+([a-zA-Z0-9_\-\.]{12,})/gi, (_match, token) => {
    return `Bearer ${maskToken(token)}`;
  });

  return sanitized;
}
