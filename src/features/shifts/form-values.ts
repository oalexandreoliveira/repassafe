/**
 * Valores do formulário de publicação/edição (S05) e sua conversão para os
 * campos que publishOfferAction/updateOfferAction já recebem (startsAt/endsAt
 * no formato datetime-local, sempre no fuso de Fortaleza).
 */
export type ShiftFormValues = {
  groupId: string;
  sector: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  start: string;
  /** HH:mm — menor ou igual ao início significa término no dia seguinte. */
  end: string;
  value: string;
  paymentTerms: string;
  notes: string;
};

export type ShiftFormField = keyof ShiftFormValues;
export type ShiftFormErrors = Partial<Record<ShiftFormField, string>>;

export const emptyShiftForm: ShiftFormValues = {
  groupId: "",
  sector: "",
  date: "",
  start: "",
  end: "",
  value: "",
  paymentTerms: "",
  notes: "",
};

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

/** Converte data + horários em startsAt/endsAt (datetime-local). */
export function composeRange({ date, start, end }: ShiftFormValues) {
  if (!date || !start || !end) return { startsAt: "", endsAt: "" };
  const endDate = end <= start ? addDays(date, 1) : date;
  return { startsAt: `${date}T${start}`, endsAt: `${endDate}T${end}` };
}

/** "2026-10-10T19:00" → { date, start } */
export function splitLocal(value: string) {
  const [date = "", time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

/** Datetime-local de Fortaleza (UTC−03:00, sem horário de verão) em ISO. */
export function fortalezaIso(local: string) {
  return local ? new Date(`${local}:00-03:00`).toISOString() : "";
}

const money = /^\d{1,7}([,.]\d{1,2})?$/;

/** Mensagens por campo; nomeiam o problema e como corrigir. */
export function validateShiftForm(
  values: ShiftFormValues,
  {
    minDate,
    requireGroup = false,
  }: { minDate?: string; requireGroup?: boolean } = {},
): ShiftFormErrors {
  const errors: ShiftFormErrors = {};
  if (requireGroup && !values.groupId)
    errors.groupId = "Escolha o grupo em que o plantão será publicado.";
  if (values.sector.trim().length < 2)
    errors.sector = "Informe o setor com pelo menos 2 caracteres.";
  if (!values.date) errors.date = "Escolha a data do plantão.";
  else if (minDate && values.date < minDate)
    errors.date = "Escolha uma data a partir de hoje.";
  if (!values.start) errors.start = "Informe o horário de início.";
  if (!values.end) errors.end = "Informe o horário de término.";
  if (!money.test(values.value.trim()))
    errors.value = "Informe o valor em reais, por exemplo 1200,00.";
  if (values.paymentTerms.trim().length < 2)
    errors.paymentTerms = "Descreva as condições de pagamento.";
  return errors;
}
