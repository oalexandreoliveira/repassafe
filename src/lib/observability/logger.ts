type Level = "info" | "warn" | "error";
const blocked = new Set([
  "password",
  "token",
  "authorization",
  "cpf",
  "patient",
  "email",
  "ip",
  "cookie",
  "secret",
]);

function isBlockedKey(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z]/g, "");
  return [...blocked].some((term) => normalized.includes(term));
}

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !isBlockedKey(key))
      .map(([key, nested]) => [key, sanitize(nested)]),
  );
}

export function log(
  level: Level,
  message: string,
  context: Record<string, unknown> = {},
) {
  const safe = sanitize(context) as Record<string, unknown>;
  const entry = JSON.stringify({
    level,
    message,
    environment: process.env.APP_ENV ?? "development",
    timestamp: new Date().toISOString(),
    ...safe,
  });
  (level === "error"
    ? console.error
    : level === "warn"
      ? console.warn
      : console.info)(entry);
}
