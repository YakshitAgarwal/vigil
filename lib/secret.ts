import { timingSafeEqual } from "node:crypto";

export function matchesSecret(
  given: string | null,
  expected: string | undefined,
): boolean {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
