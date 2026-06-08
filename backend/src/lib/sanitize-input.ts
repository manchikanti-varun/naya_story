/**
 * Sanitize user input to prevent NoSQL injection.
 * Strips keys starting with `$` from objects (MongoDB operators).
 */
export function sanitizeMongoQuery(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (typeof input !== "object") return input;
  if (Array.isArray(input)) return input.map(sanitizeMongoQuery);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    // Strip any keys that start with $ (MongoDB operators)
    if (key.startsWith("$")) continue;
    result[key] = sanitizeMongoQuery(value);
  }
  return result;
}

/**
 * Escape special regex characters in a string to prevent ReDoS attacks.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validate that a string value doesn't contain MongoDB operators.
 * Returns the string if safe, throws if it contains injection patterns.
 */
export function assertSafeStringParam(value: string | undefined): string | undefined {
  if (!value) return value;
  if (value.includes("$") && /\$[a-z]/i.test(value)) {
    throw new Error("Invalid characters in parameter");
  }
  return value;
}
