import { formatAuditTime, formatTime, dayKey } from "@/features/shifts/format";

export type ApplicationItem = {
  id: string;
  candidate_id: string;
  candidate_display_name: string;
  status: string;
  created_at: string;
};

/** "Candidatou-se hoje, 14:32" / "ontem, 21:48" / "10/10 09:12". */
export function appliedAt(value: string, now: Date) {
  const days =
    (Date.parse(`${dayKey(now)}T00:00:00Z`) -
      Date.parse(`${dayKey(value)}T00:00:00Z`)) /
    86_400_000;
  if (days === 0) return `Candidatou-se hoje, ${formatTime(value)}`;
  if (days === 1) return `Candidatou-se ontem, ${formatTime(value)}`;
  return `Candidatou-se em ${formatAuditTime(value)}`;
}
