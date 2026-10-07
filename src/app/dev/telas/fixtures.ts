/**
 * Dados fictícios para as prévias de tela (/dev/telas). Nenhum dado real ou
 * de paciente. Datas fixas para comparação com design/screens/png.
 */
import type { OfferSummary } from "@/features/shifts/offer-view";
import type { ApplicationItem } from "@/components/screens/candidate-selection";
import type { NotificationRow } from "@/components/screens/notifications-list";
import type {
  AgreementContent,
  EvidenceItem,
} from "@/components/screens/agreement-registered";

/** Sábado, 10/10/2026, 06:00 em Fortaleza. */
export const now = new Date("2026-10-10T09:00:00.000Z");

export const viewerId = "00000000-0000-4000-8000-000000000001";
export const ownerId = "00000000-0000-4000-8000-000000000002";

const offer = (overrides: Partial<OfferSummary>): OfferSummary => ({
  id: "10000000-0000-4000-8000-000000000001",
  ownerId,
  status: "open_normal",
  sector: "UTI Adulto",
  startsAt: "2026-10-10T22:00:00.000Z",
  endsAt: "2026-10-11T10:00:00.000Z",
  valueCents: 120000,
  paymentTerms: "Transferência em até 30 dias após o plantão",
  notes: "Passagem presencial às 18h45 com a equipe de enfermagem.",
  publishedAt: "2026-10-10T08:40:00.000Z",
  groupId: "20000000-0000-4000-8000-000000000001",
  groupName: "Plantonistas UTI",
  institutionName: "Hospital Exemplo",
  requiresApproval: true,
  ...overrides,
});

export const uti = offer({});
export const prontoSocorro = offer({
  id: "10000000-0000-4000-8000-000000000002",
  sector: "Pronto-socorro",
  startsAt: "2026-10-10T10:00:00.000Z",
  endsAt: "2026-10-10T22:00:00.000Z",
  publishedAt: "2026-10-10T07:00:00.000Z",
  groupName: "Clínica PS",
});
export const enfermaria = offer({
  id: "10000000-0000-4000-8000-000000000003",
  sector: "Enfermaria",
  startsAt: "2026-10-11T10:00:00.000Z",
  endsAt: "2026-10-11T16:00:00.000Z",
  publishedAt: "2026-10-09T18:00:00.000Z",
});

export const applications: ApplicationItem[] = [
  ["Dra. Ana Moreira", "2026-10-10T08:32:00.000Z"],
  ["Dr. Rafael Souza", "2026-10-10T08:45:00.000Z"],
  ["Dra. Lia Costa", "2026-10-09T23:48:00.000Z"],
].map(([name, createdAt], index) => ({
  id: `30000000-0000-4000-8000-00000000000${index + 1}`,
  candidate_id: `00000000-0000-4000-8000-00000000001${index}`,
  candidate_display_name: name,
  status: "active",
  created_at: createdAt,
}));

export const notifications: NotificationRow[] = [
  {
    id: "n1",
    event_type: "substitution.selected",
    title: "Você foi selecionado",
    body: "Confirme as condições do plantão de Pronto-socorro em Dom 11/10, 07h – 19h.",
    href: "#",
    created_at: "2026-10-10T08:59:40.000Z",
    read_at: null,
  },
  {
    id: "n2",
    event_type: "offer.published",
    title: "Novo plantão disponível",
    body: "UTI Adulto · Sáb 10/10, 19h – 07h · Plantonistas UTI",
    href: "#",
    created_at: "2026-10-10T08:58:00.000Z",
    read_at: null,
  },
  {
    id: "n3",
    event_type: "application.created",
    title: "Nova candidatura recebida",
    body: "Para o seu plantão de domingo no Pronto-socorro",
    href: "#",
    created_at: "2026-10-10T08:00:00.000Z",
    read_at: "2026-10-10T08:10:00.000Z",
  },
  {
    id: "n4",
    event_type: "substitution.confirmed",
    title: "Repasse confirmado",
    body: "Enfermaria, 08/10",
    href: "#",
    created_at: "2026-10-09T15:00:00.000Z",
    read_at: "2026-10-09T16:00:00.000Z",
  },
];

export const agreementContent: AgreementContent = {
  document_type: "Registro de repasse de plantão",
  agreement_id: "7d1c2e9a-5b3f-4c8d-9e0a-1b2c3d4e5f60",
  parties: {
    owner: { display_name: "Dr. Rafael Souza" },
    substitute: { display_name: "Dra. Ana Moreira" },
  },
  group: { name: "Plantonistas UTI", institution_name: "Hospital Exemplo" },
  agreement_confirmed_at: "2026-10-10T20:02:00.000Z",
  terms: {
    starts_at: "2026-10-10T22:00:00.000Z",
    ends_at: "2026-10-11T10:00:00.000Z",
    sector: "UTI Adulto",
    value_cents: 120000,
    payment_terms: "Transferência em até 30 dias após o plantão",
    approved_by: "Coordenação Plantonistas UTI",
  },
};

const hash = (seed: string) => seed.repeat(64).slice(0, 64);

export const evidence: EvidenceItem[] = [
  ["owner_terms_published", "2026-10-10T12:12:00.000Z", "a"],
  ["substitute_accepted", "2026-10-10T20:02:00.000Z", "b"],
  ["institution_approved", "2026-10-10T21:15:00.000Z", "c"],
  ["document_generated", "2026-10-10T21:15:30.000Z", "d"],
].map(([type, at, seed], index) => ({
  id: `e${index}`,
  event_type: type,
  actor_id: null,
  occurred_at: at,
  recorded_at: at,
  event_sha256: hash(seed),
}));
