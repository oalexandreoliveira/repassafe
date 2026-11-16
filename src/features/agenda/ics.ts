import { dayKey } from "@/features/shifts/format";
import { formatCurrency } from "@/features/shifts/schemas";
import { addDays } from "./schema";
import { paymentDirection } from "./model";
import type { AgendaKind } from "./schema";

/**
 * Arquivo .ics (RFC 5545) de um plantão da agenda: o evento do plantão e, se
 * houver data-limite em aberto, um evento de dia inteiro no vencimento com
 * alarme às 8h. É gerado sob demanda e não se atualiza depois. Valor e nome
 * de quem paga ou recebe só entram quando o usuário pede; observações nunca.
 */
export type AgendaIcsInput = {
  /** Identificador estável: o mesmo plantão substitui o evento ao reimportar. */
  uid: string;
  kind: AgendaKind;
  /** "Meu plantão" já repassado a um colega. */
  handedOver?: boolean;
  startsAt: string;
  endsAt: string;
  /** "UTI · Hospital X" */
  title: string;
  location: string;
  /** YYYY-MM-DD, só quando o pagamento está em aberto. */
  dueDate: string | null;
  /** Primeiro aviso em dias antes do vencimento (0 = só no dia). */
  leadDays: number;
  url: string;
  details: {
    valueCents: number | null;
    counterparty: string;
    counterpartyLabel: string;
  } | null;
  now: Date;
};

const CRLF = "\r\n";
const encoder = new TextEncoder();

/** Escapa TEXT (§3.3.11). */
export function icsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Dobra linhas acima de 75 octetos sem partir caracteres UTF-8 (§3.1). */
export function foldLine(line: string) {
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = parts.length ? 74 : 75;
    if (size + bytes > limit) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

const utc = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
const dateValue = (date: string) => date.replace(/-/g, "");

/** "12/10" no fuso de Fortaleza. */
function shiftDay(startsAt: string) {
  const [, month, day] = dayKey(startsAt).split("-");
  return `${day}/${month}`;
}

/** Disparo relativo ao início do dia (00h): 8h no dia ou 8h de N dias antes. */
function trigger(daysBefore: number) {
  if (daysBefore <= 0) return "PT8H";
  const days = daysBefore - 1;
  return days ? `-P${days}DT16H` : "-PT16H";
}

function detailText(details: AgendaIcsInput["details"]) {
  if (!details) return "";
  const parts = [
    details.valueCents !== null
      ? `Valor previsto: ${formatCurrency(details.valueCents)}.`
      : "",
    details.counterparty
      ? `${details.counterpartyLabel}: ${details.counterparty}.`
      : "",
  ].filter(Boolean);
  return parts.length ? ` ${parts.join(" ")}` : "";
}

export function agendaIcs(input: AgendaIcsInput) {
  const stamp = utc(input.now);
  const passed = input.kind === "passed" || input.handedOver;
  const label = passed
    ? "Plantão repassado"
    : input.kind === "took"
      ? "Plantão assumido"
      : "Plantão";
  const extra = detailText(input.details);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Repassafe//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.uid}-plantao@repassafe.com.br`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${utc(new Date(input.startsAt))}`,
    `DTEND:${utc(new Date(input.endsAt))}`,
    `SUMMARY:${icsText(`${label} · ${input.title}`)}`,
    `LOCATION:${icsText(input.location)}`,
    `DESCRIPTION:${icsText(`Da sua agenda no Repassafe.${extra} Detalhes em ${input.url}`)}`,
    `URL:${input.url}`,
    // Plantão repassado não ocupa a agenda de quem repassou.
    `TRANSP:${passed ? "TRANSPARENT" : "OPAQUE"}`,
    "END:VEVENT",
  ];
  if (input.dueDate) {
    const due =
      paymentDirection(input.kind) === "receive"
        ? "Pagamento a receber vence hoje"
        : "Pagamento a fazer vence hoje";
    const summary = `${due} · Plantão de ${shiftDay(input.startsAt)}`;
    const alarms = [...new Set([0, Math.max(0, input.leadDays)])];
    lines.push(
      "BEGIN:VEVENT",
      `UID:${input.uid}-vencimento@repassafe.com.br`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dateValue(input.dueDate)}`,
      `DTEND;VALUE=DATE:${dateValue(addDays(input.dueDate, 1))}`,
      `SUMMARY:${icsText(summary)}`,
      `DESCRIPTION:${icsText(`${input.title}.${extra} Este evento não se atualiza: se o pagamento já foi feito, apague-o. Detalhes em ${input.url}`)}`,
      `URL:${input.url}`,
      "TRANSP:TRANSPARENT",
      ...alarms.flatMap((days) => [
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsText(days ? `Pagamento vence em ${days} ${days === 1 ? "dia" : "dias"}` : due)}`,
        `TRIGGER;RELATED=START:${trigger(days)}`,
        "END:VALARM",
      ]),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join(CRLF) + CRLF;
}

/** "plantao-2026-10-12.ics" */
export function icsFileName(startsAt: string) {
  return `plantao-${dayKey(startsAt)}.ics`;
}

/** Resposta de download do arquivo .ics: privada, sem cache e sem farejar tipo. */
export function icsResponse(body: string, fileName: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
