/** Token do link de convite: 32 a 64 caracteres base64url (gerado no servidor). */
export const inviteTokenPattern = /^[A-Za-z0-9_-]{32,64}$/;

export function invitePath(token: string) {
  return `/grupos/convite/${token}`;
}

/**
 * Destinos compartilháveis permitidos. Não admite host, query, fragmento,
 * codificação ou segmentos extras; cada página mantém sua autorização.
 */
export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^\/grupos\/convite\/([^/?#]+)$/.exec(value);
  if (match && inviteTokenPattern.test(match[1])) return value;
  return /^\/(?:plantoes|acordos\/registrados|acordos)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : null;
}

export function loginPath(destination: string) {
  const next = safeReturnPath(destination);
  return next ? `/entrar?proximo=${encodeURIComponent(next)}` : "/entrar";
}
