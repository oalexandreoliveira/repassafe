import { timingSafeEqual } from "node:crypto";

export function hasValidMonitoringToken(
  authorizationHeader: string | null,
  expectedToken: string,
) {
  const supplied = authorizationHeader?.replace(/^Bearer\s+/i, "");
  if (!supplied) return false;
  const actual = Buffer.from(supplied);
  const expected = Buffer.from(expectedToken);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
