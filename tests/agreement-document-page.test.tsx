import { createHash } from "node:crypto";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AgreementDocumentPage from "@/app/acordos/[id]/page";
import {
  getAdministrativeAccess,
  getVerifiedIdentity,
  requireAdminIdentity,
} from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

vi.mock("@/lib/auth/session", () => ({
  getVerifiedIdentity: vi.fn(),
  getAdministrativeAccess: vi.fn(),
  requireAdminIdentity: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  redirect: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
}));

const id = "e1000000-0000-4000-8000-000000000500";
const timestamp = "2026-10-09T12:00:00.000Z";
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const content = {
  document_type: "Documento eletrônico do repasse",
  agreement_id: id,
  substitution_id: "substitution",
  parties: {
    owner: { display_name: "Titular" },
    substitute: { display_name: "Substituto" },
  },
  group: null,
  agreement_confirmed_at: timestamp,
  terms: {
    starts_at: timestamp,
    ends_at: "2026-10-10T12:00:00.000Z",
    sector: "UTI",
    value_cents: 100000,
    payment_terms: "30 dias",
  },
};
const document = {
  agreement_id: id,
  schema_version: "1.0",
  canonical_content: content,
  canonical_content_text: JSON.stringify(content),
  document_sha256: hash(JSON.stringify(content)),
  generated_at: timestamp,
};
function event(eventId: string, type: string, previous: string | null) {
  const fields = {
    id: eventId,
    agreement_id: id,
    event_type: type,
    actor_id: null,
    occurred_at: timestamp,
    recorded_at: timestamp,
    document_sha256: document.document_sha256,
    previous_event_sha256: previous,
  };
  const event_content = JSON.stringify(fields);
  return { ...fields, event_content, event_sha256: hash(event_content) };
}
const first = event("event-1", "substitute_accepted", null);
const last = event("event-2", "document_generated", first.event_sha256);
type Response = {
  data: unknown;
  error: { message: string; code?: string } | null;
};
let responses: Record<string, Response>;
const filters = vi.fn();
const from = vi.fn((table: string) => {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn((column: string, value: string) => {
      filters(table, column, value);
      return query;
    }),
    order: vi.fn(() => query),
    maybeSingle: () => Promise.resolve(responses[table]),
    then: (resolve: (value: Response) => unknown) =>
      Promise.resolve(responses[table]).then(resolve),
  };
  return query;
});
async function renderPage() {
  render(await AgreementDocumentPage({ params: Promise.resolve({ id }) }));
}
function expectUnavailable() {
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Não foi possível ler a trilha de evidências",
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "conteúdo íntegro; cadeia de eventos indisponível",
  );
  expect(screen.queryByText(/encontrou divergência/)).not.toBeInTheDocument();
  expect(screen.queryByText("Imutável")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("region", { name: "Trilha de auditoria" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Tentar novamente" }),
  ).toHaveAttribute("href", `/acordos/${id}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  responses = {
    agreement_documents: { data: { ...document }, error: null },
    agreement_evidence_events: {
      data: [{ ...first }, { ...last }],
      error: null,
    },
    substitutions: { data: { selected_at: timestamp }, error: null },
  };
  vi.mocked(getVerifiedIdentity).mockResolvedValue({
    supabase: { from },
    userId: "party",
    claims: {},
  } as unknown as NonNullable<Awaited<ReturnType<typeof getVerifiedIdentity>>>);
  vi.mocked(getAdministrativeAccess).mockResolvedValue(null);
});
afterEach(cleanup);

describe("/acordos/[id] — leitura e verificação de evidências (A2)", () => {
  it("verifica documento e cadeia lidos com a sessão da parte", async () => {
    await renderPage();
    expect(screen.getByRole("status")).toHaveTextContent(
      "conteúdo íntegro; cadeia de eventos íntegra",
    );
    expect(screen.getByText("Imutável")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(filters).toHaveBeenCalledWith(
      "agreement_evidence_events",
      "agreement_id",
      id,
    );
  });

  it.each([
    {
      code: "42501",
      message: "permission denied for table agreement_evidence_events",
    },
    { code: "57014", message: "statement timeout" },
    { message: "TypeError: fetch failed" },
  ])(
    "trata erro de leitura como indisponibilidade: $message",
    async (error) => {
      responses.agreement_evidence_events = { data: null, error };
      await renderPage();
      expectUnavailable();
      expect(createAdminClient).not.toHaveBeenCalled();
      expect(screen.queryByText(error.message)).not.toBeInTheDocument();
    },
  );

  it("descarta dados parciais quando a leitura retorna erro", async () => {
    responses.agreement_evidence_events.error = { message: "partial response" };
    await renderPage();
    expectUnavailable();
    expect(
      screen.queryByText("Documento eletrônico emitido"),
    ).not.toBeInTheDocument();
  });

  it("não considera dados nulos uma cadeia comprovadamente divergente", async () => {
    responses.agreement_evidence_events.data = null;
    await renderPage();
    expectUnavailable();
  });

  it.each([
    ["cadeia vazia", []],
    ["hash adulterado", [first, { ...last, event_sha256: "0".repeat(64) }]],
    ["elo removido", [last]],
    ["sem emissão final", [first]],
    ["conteúdo inválido", [first, { ...last, event_content: "null" }]],
  ])(
    "mantém divergência para leitura bem-sucedida com %s",
    async (_label, events) => {
      responses.agreement_evidence_events.data = events;
      await renderPage();
      expect(screen.getByRole("alert")).toHaveTextContent(
        "encontrou divergência",
      );
      expect(screen.getByRole("status")).toHaveTextContent(
        "cadeia de eventos divergente",
      );
      expect(screen.queryByText("Imutável")).not.toBeInTheDocument();
    },
  );

  it("preserva divergência comprovada do documento mesmo com trilha indisponível", async () => {
    responses.agreement_documents.data = {
      ...document,
      canonical_content_text: "adulterado",
    };
    responses.agreement_evidence_events = {
      data: null,
      error: { message: "unavailable" },
    };
    await renderPage();
    expect(screen.getByText(/encontrou divergência/)).toBeInTheDocument();
    expect(
      screen.getByText(/Não foi possível ler a trilha/),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "conteúdo divergente; cadeia de eventos indisponível",
    );
  });

  it("distingue falha de leitura do documento de documento não encontrado", async () => {
    responses.agreement_documents = {
      data: null,
      error: { message: "database unavailable" },
    };
    await renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível ler o documento",
    );
    expect(
      screen.getByRole("link", { name: "Tentar novamente" }),
    ).toHaveAttribute("href", `/acordos/${id}`);
    expect(notFound).not.toHaveBeenCalled();
    expect(screen.queryByText("Imutável")).not.toBeInTheDocument();
  });

  it("mantém 404 para documento ausente ou ocultado por RLS sem erro", async () => {
    responses.agreement_documents.data = null;
    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
  });

  it("mantém revalidação administrativa antes do cliente privilegiado", async () => {
    vi.mocked(getAdministrativeAccess).mockResolvedValue({
      user_id: "admin",
      active: true,
    });
    vi.mocked(createAdminClient).mockReturnValue({
      from,
    } as unknown as ReturnType<typeof createAdminClient>);
    await renderPage();
    expect(requireAdminIdentity).toHaveBeenCalledOnce();
    expect(
      vi.mocked(requireAdminIdentity).mock.invocationCallOrder[0],
    ).toBeLessThan(vi.mocked(createAdminClient).mock.invocationCallOrder[0]);
    expect(
      screen.getByRole("link", { name: "Voltar aos plantões" }),
    ).toHaveAttribute("href", "/admin");
  });
});
