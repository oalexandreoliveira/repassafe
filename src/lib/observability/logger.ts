type Level = "info" | "warn" | "error";
const blocked = new Set([
  "password",
  "token",
  "authorization",
  "cpf",
  "patient",
]);
export function log(
  level: Level,
  message: string,
  context: Record<string, unknown> = {},
) {
  const safe = Object.fromEntries(
    Object.entries(context).filter(([key]) => !blocked.has(key.toLowerCase())),
  );
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
