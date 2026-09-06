// Script security validator for scientific code execution and sandbox verification
export const FORBIDDEN_SCRIPT_PATTERNS = [
  /\bimport\s+(?:os|subprocess|socket|pty|ctypes|shutil|urllib|requests|http|multiprocessing|threading|signal|posix|winreg)\b/i,
  /\bfrom\s+(?:os|subprocess|socket|pty|ctypes|shutil|urllib|requests|http|multiprocessing|threading|signal|posix|winreg)\s+import\b/i,
  /\b(?:eval|exec|__import__|compile)\s*\(/,
  /\b(?:open|file)\s*\(/,
  /\b(?:os\.system|os\.popen|os\.spawn|subprocess\.run|subprocess\.Popen)\b/,
  /\b__subclasses__\b/,
  /\b__builtins__\b/,
];

export function validateScriptSecurity(script: string): { valid: boolean; reason?: string } {
  if (script.length > 50_000) {
    return { valid: false, reason: "Script exceeds maximum allowable size of 50KB." };
  }
  for (const pattern of FORBIDDEN_SCRIPT_PATTERNS) {
    if (pattern.test(script)) {
      return {
        valid: false,
        reason: "Script contains forbidden system, process, or network operations.",
      };
    }
  }
  return { valid: true };
}
