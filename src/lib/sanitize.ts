/**
 * ═══════════════════════════════════════════════════════════════
 * INPUT SANITIZATION — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Prevents XSS in user-generated content (notes, names, categories).
 * Strips HTML tags and encodes dangerous characters.
 * ═══════════════════════════════════════════════════════════════
 */

/** Characters that need HTML-entity encoding */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

/** Strip all HTML tags from a string */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** Encode dangerous HTML characters */
export function encodeHtml(input: string): string {
  return input.replace(/[&<>"'/]/g, (ch) => HTML_ENTITIES[ch] || ch);
}

/** Full sanitize: strip HTML then encode remaining dangerous chars */
export function sanitize(input: string): string {
  return encodeHtml(stripHtml(input));
}

/** Sanitize all string values in a flat object (non-recursive) */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = typeof value === "string" ? sanitize(value) : value;
  }
  return result as T;
}

/** Truncate string to max length, adding ellipsis if truncated */
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength - 1) + "…";
}

/** Validate that a string contains no script-like patterns */
export function isSafeInput(input: string): boolean {
  const dangerous = /<script|javascript:|on\w+\s*=|data:\s*text\/html|vbscript:/i;
  return !dangerous.test(input);
}
