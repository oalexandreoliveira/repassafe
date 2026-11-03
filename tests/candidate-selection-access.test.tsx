import { beforeEach, expect, it, vi } from "vitest";
import { applications, now, uti, viewerId } from "@/app/dev/telas/fixtures";
const mocks = vi.hoisted(() => ({ details: vi.fn() }));
vi.mock("@/lib/shifts/data", () => ({ getShiftDetails: mocks.details }));
vi.mock("@/app/plantoes/actions", () => ({
  selectCandidateAction: vi.fn(),
  confirmSubstitutionAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
  notFound: () => {
    throw new Error("not-found");
  },
}));
import ConditionsPage from "@/app/plantoes/[id]/condicoes/page";
import ChoosePage from "@/app/plantoes/[id]/candidaturas/page";

const workspace = () => ({
  identity: { userId: viewerId },
  offer: {
    id: uti.id,
    owner_id: viewerId,
    status: "open_normal",
    starts_at: uti.startsAt,
    ends_at: uti.endsAt,
    sector: uti.sector,
    groups: null,
  },
  applications,
  substitutions: [],
  ownerTermsAcknowledged: true,
  candidateProfilesFailed: false,
});
const review = (id = applications[0].id) =>
  ConditionsPage({
    params: Promise.resolve({ id: uti.id }),
    searchParams: Promise.resolve({ candidatura: id }),
  });
const choose = () =>
  ChoosePage({
    params: Promise.resolve({ id: uti.id }),
    searchParams: Promise.resolve({}),
  });
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  mocks.details.mockResolvedValue(workspace());
});
import { afterEach } from "vitest";
afterEach(() => vi.useRealTimers());

it("titular pode consultar e revisar um candidato vigente", async () => {
  expect((await choose()).props.applications).toEqual(applications);
  expect((await review()).props.candidateProfile).toEqual(
    applications[0].professional,
  );
});
it.each([
  "outro titular",
  "oferta fechada",
  "sem aceite",
  "candidatura retirada",
])("impede revisão e exposição indevida: %s", async (reason) => {
  const data = workspace();
  if (reason === "outro titular") data.identity.userId = "outsider";
  if (reason === "oferta fechada") data.offer.status = "confirmed";
  if (reason === "sem aceite") data.ownerTermsAcknowledged = false;
  if (reason === "candidatura retirada")
    data.applications = applications.map((a) => ({
      ...a,
      status: "withdrawn",
    }));
  mocks.details.mockResolvedValue(data);
  await expect(review()).rejects.toThrow(`redirect:/plantoes/${uti.id}`);
  await expect(choose()).rejects.toThrow(`redirect:/plantoes/${uti.id}`);
});
it("não aceita candidatura de outra oferta", async () => {
  await expect(review("unrelated-application")).rejects.toThrow(
    `redirect:/plantoes/${uti.id}`,
  );
});
it.each([
  undefined,
  { ...applications[0].professional!, valid_until: now.toISOString() },
  { ...applications[0].professional!, verified: false },
])(
  "revalida no servidor antes de mostrar a confirmação",
  async (professional) => {
    mocks.details.mockResolvedValue({
      ...workspace(),
      applications: [{ ...applications[0], professional }],
    });
    await expect(review()).rejects.toThrow(
      `redirect:/plantoes/${uti.id}/candidaturas?verificacao=atualizada`,
    );
  },
);
it("falha de consulta não permite confirmar com dados antigos", async () => {
  mocks.details.mockResolvedValue({
    ...workspace(),
    candidateProfilesFailed: true,
  });
  await expect(review()).rejects.toThrow(
    "Não foi possível consultar os perfis",
  );
  await expect(choose()).rejects.toThrow(
    "Não foi possível consultar os perfis",
  );
});
