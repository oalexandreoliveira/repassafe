/** Token do link de convite: 32 a 64 caracteres base64url (gerado no servidor). */
export const inviteTokenPattern = /^[A-Za-z0-9_-]{32,64}$/;

export function invitePath(token: string) {
  return `/grupos/convite/${token}`;
}

/**
 * Único destino interno aceito depois do login: a página de um convite de
 * grupo. Qualquer outro valor é descartado (evita redirecionamento aberto).
 */
export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^\/grupos\/convite\/([^/?#]+)$/.exec(value);
  return match && inviteTokenPattern.test(match[1]) ? value : null;
}
