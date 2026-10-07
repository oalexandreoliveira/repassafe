/**
 * Date and time wording from design/DESIGN.md §8, always in the product time
 * zone (America/Fortaleza, the rule already used by the shift domain).
 */
const timeZone = "America/Fortaleza";

const weekdaysShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const weekdaysLong = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
const months = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function zoned(value: string | Date) {
  const parts = Object.fromEntries(
    partsFormatter
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value]),
  );
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  return {
    year,
    month,
    day,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
    /** Calendar day index, for "today"/"yesterday" comparisons. */
    dayNumber: Date.UTC(year, month - 1, day) / 86_400_000,
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

/** "12/10" */
export function formatShortDate(value: string | Date) {
  const date = zoned(value);
  return `${pad(date.day)}/${pad(date.month)}`;
}

/** "Sáb, 12/10" */
export function formatShiftDay(value: string | Date) {
  return `${weekdaysShort[zoned(value).weekday]}, ${formatShortDate(value)}`;
}

/** "Sábado, 12 out" (shown in uppercase by the day-group heading). */
export function formatDayHeading(value: string | Date) {
  const date = zoned(value);
  return `${weekdaysLong[date.weekday]}, ${date.day} ${months[date.month - 1]}`;
}

/** Stable key for grouping shifts by calendar day. */
export function dayKey(value: string | Date) {
  const date = zoned(value);
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

function shortHour(value: string | Date) {
  const date = zoned(value);
  return `${pad(date.hour)}h${date.minute ? pad(date.minute) : ""}`;
}

/** "10/10 09:12" — audit trail timestamps. */
export function formatAuditTime(value: string | Date) {
  const date = zoned(value);
  return `${formatShortDate(value)} ${pad(date.hour)}:${pad(date.minute)}`;
}

/** "19:00" */
export function formatTime(value: string | Date) {
  const date = zoned(value);
  return `${pad(date.hour)}:${pad(date.minute)}`;
}

/** "19h – 07h" (cards) */
export function formatHourRangeShort(start: string | Date, end: string | Date) {
  return `${shortHour(start)} – ${shortHour(end)}`;
}

/** "19:00 – 07:00" (details) */
export function formatHourRange(start: string | Date, end: string | Date) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** "12/10, 19:00 → 13/10, 07:00" */
export function formatPeriod(start: string | Date, end: string | Date) {
  return `${formatShortDate(start)}, ${formatTime(start)} → ${formatShortDate(end)}, ${formatTime(end)}`;
}

/** "12 horas", "1 hora", "6 horas e 30 min" */
export function formatDuration(start: string | Date, end: string | Date) {
  const minutes = Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000),
  );
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourText = `${hours} ${hours === 1 ? "hora" : "horas"}`;
  if (!rest) return hourText;
  return hours ? `${hourText} e ${rest} min` : `${rest} min`;
}

type Elapsed =
  | { kind: "now" }
  | { kind: "minutes"; value: number }
  | { kind: "hours"; value: number }
  | { kind: "yesterday" }
  | { kind: "date"; value: string };

function elapsed(value: string | Date, now: Date): Elapsed {
  const minutes = Math.floor(
    (now.getTime() - new Date(value).getTime()) / 60_000,
  );
  if (minutes < 1) return { kind: "now" };
  const days = zoned(now).dayNumber - zoned(value).dayNumber;
  if (days === 0)
    return minutes < 60
      ? { kind: "minutes", value: minutes }
      : { kind: "hours", value: Math.floor(minutes / 60) };
  if (days === 1) return { kind: "yesterday" };
  return { kind: "date", value: formatShortDate(value) };
}

/** "agora", "2 min", "1 h", "ontem", "08/10" — notification list. */
export function formatNotificationTime(value: string | Date, now = new Date()) {
  const result = elapsed(value, now);
  switch (result.kind) {
    case "now":
      return "agora";
    case "minutes":
      return `${result.value} min`;
    case "hours":
      return `${result.value} h`;
    case "yesterday":
      return "ontem";
    case "date":
      return result.value;
  }
}

/** "Publicado há 20 min", "Publicado há 2 h", "Publicado ontem". */
export function formatPublishedAgo(value: string | Date, now = new Date()) {
  const result = elapsed(value, now);
  switch (result.kind) {
    case "now":
      return "Publicado agora";
    case "minutes":
      return `Publicado há ${result.value} min`;
    case "hours":
      return `Publicado há ${result.value} h`;
    case "yesterday":
      return "Publicado ontem";
    case "date":
      return `Publicado em ${result.value}`;
  }
}
