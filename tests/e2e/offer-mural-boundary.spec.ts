import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const enabled = process.env.RUN_OFFER_MURAL_E2E === "1";
test.skip(!enabled, "Requires explicit opt-in and local Supabase.");
test.setTimeout(180000);

test("separates offers from external agreements and filters all accessible offers", async ({
  page,
}) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  expect(["localhost", "127.0.0.1"]).toContain(new URL(url).hostname);
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const tag = `Mural ${Date.now()}`;
  const password = `Synthetic-${crypto.randomUUID()}!`;
  async function professional(name: string) {
    const email = `mural-${crypto.randomUUID()}@example.test`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    expect(error).toBeNull();
    const id = data.user!.id;
    const { error: profileError } = await admin.from("profiles").insert({
      id,
      display_name: `${tag} ${name}`,
      role: "doctor",
      status: "approved",
      verification_valid_until: new Date(
        Date.now() + 90 * 86400000,
      ).toISOString(),
    });
    expect(profileError).toBeNull();
    const client = createClient(
      url,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    );
    const { error: loginError } = await client.auth.signInWithPassword({
      email,
      password,
    });
    expect(loginError).toBeNull();
    return { id, email, client };
  }
  const owner = await professional("Titular");
  const viewer = await professional("Candidato");
  const institution = crypto.randomUUID();
  const groups = ["A", "B", "Restrito"].map((name) => ({
    id: crypto.randomUUID(),
    name: `${tag} ${name}`,
    institution_id: institution,
    requires_approval: false,
  }));
  expect(
    (
      await admin
        .from("institutions")
        .insert({ id: institution, name: "Hospital sintético" })
    ).error,
  ).toBeNull();
  expect((await admin.from("groups").insert(groups)).error).toBeNull();
  expect(
    (
      await admin.from("group_memberships").insert([
        ...groups.map((group) => ({
          group_id: group.id,
          profile_id: owner.id,
          role: "doctor",
        })),
        ...groups.slice(0, 2).map((group) => ({
          group_id: group.id,
          profile_id: viewer.id,
          role: "doctor",
        })),
      ])
    ).error,
  ).toBeNull();

  async function command(
    client: SupabaseClient,
    actor: string,
    operation: string,
    target: string | null,
    payload = {},
  ) {
    const { data, error } = await client
      .from("workflow_commands")
      .insert({
        id: crypto.randomUUID(),
        actor_id: actor,
        command: operation,
        target_id: target,
        payload,
      })
      .select("result_id")
      .single();
    expect(error).toBeNull();
    return data!.result_id as string;
  }
  async function publish(
    label: string,
    days: number,
    group: string | null = null,
  ) {
    return command(owner.client, owner.id, "publish_offer", null, {
      group_id: group,
      starts_at: new Date(Date.now() + days * 86400000).toISOString(),
      ends_at: new Date(
        Date.now() + days * 86400000 + 6 * 3600000,
      ).toISOString(),
      sector: `${tag} ${label}`,
      value_cents: 55000,
      payment_terms: "PIX em 10 dias",
      owner_terms_acknowledged: true,
    });
  }
  const free = await publish("Livre distante", 10);
  await publish("Grupo A", 1, groups[0].id);
  await publish("Grupo B", 2, groups[1].id);
  await publish("Oculto", 3, groups[2].id);
  const confirmed = await publish("Confirmado", 4);
  // Publication alone creates neither an offer confirmation nor an external agreement.
  expect(
    (
      await admin
        .from("shift_agreements")
        .select("id")
        .in("offer_id", [free, confirmed])
    ).data,
  ).toEqual([]);
  expect(
    (
      await admin
        .from("external_agreements")
        .select("id")
        .eq("creator_id", owner.id)
    ).data,
  ).toEqual([]);
  const application = await command(
    viewer.client,
    viewer.id,
    "apply_to_offer",
    confirmed,
  );
  const substitution = await command(
    owner.client,
    owner.id,
    "select_candidate",
    application,
  );
  await command(
    viewer.client,
    viewer.id,
    "confirm_substitution",
    substitution,
    { accepted: true, terms_acknowledged: true },
  );
  const { data: records, error: recordError } = await admin
    .from("shift_agreements")
    .select("id")
    .eq("offer_id", confirmed);
  expect(recordError).toBeNull();
  expect(records).toHaveLength(1);
  expect(
    (
      await admin
        .from("external_agreements")
        .select("id")
        .eq("creator_id", owner.id)
    ).data,
  ).toEqual([]);

  await page.goto("/entrar");
  await page.getByLabel("E-mail ou celular confirmado").fill(viewer.email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/plantoes$/, { timeout: 30000 });
  const heading = (label: string) =>
    page.getByRole("heading", { name: new RegExp(`${tag} ${label}`) });
  await expect(heading("Livre distante")).toBeVisible();
  await expect(heading("Grupo A")).toBeVisible();
  await expect(heading("Grupo B")).toBeVisible();
  await expect(heading("Oculto")).toHaveCount(0);
  await expect(heading("Confirmado")).toHaveCount(0);
  await expect(page.getByLabel("Origem das ofertas")).toHaveValue("todos");
  await expect(
    page.getByText("Ofertas livres e dos grupos aos quais você tem acesso"),
  ).toBeVisible();
  await expect(page.getByRole("option", { name: groups[2].name })).toHaveCount(
    0,
  );

  await page.getByLabel("Buscar setor, hospital ou grupo").fill(tag);
  await page.getByLabel("Origem das ofertas").selectOption("livres");
  await page.getByRole("button", { name: "Aplicar filtros" }).press("Enter");
  await expect(heading("Livre distante")).toBeVisible();
  await expect(heading("Grupo A")).toHaveCount(0);
  await page.getByRole("link", { name: "Esta semana", exact: true }).click();
  await expect(page).toHaveURL(/grupo=livres/);
  await expect(
    page.getByRole("heading", { name: "Nenhum plantão neste filtro" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Todos os períodos", exact: true })
    .click();
  await expect(heading("Livre distante")).toBeVisible();
  await page.getByLabel("Origem das ofertas").selectOption("grupos");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(heading("Grupo A")).toBeVisible();
  await expect(heading("Grupo B")).toBeVisible();
  await expect(heading("Livre distante")).toHaveCount(0);
  await page.getByLabel("Origem das ofertas").selectOption(groups[1].id);
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(heading("Grupo B")).toBeVisible();
  await expect(heading("Grupo A")).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel("Origem das ofertas")).toHaveValue(groups[1].id);
  await page.getByRole("link", { name: "Limpar filtros", exact: true }).click();
  await expect(page).toHaveURL(/\/plantoes$/);
  await expect(heading("Livre distante")).toBeVisible();
  await page.goto(
    `/plantoes?q=${encodeURIComponent(tag)}&grupo=${groups[2].id}`,
  );
  await expect(heading("Oculto")).toHaveCount(0);
  await expect(page.getByLabel("Origem das ofertas")).toHaveValue("todos");
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.impeccable/review/mural-scope-${width}.png`,
      fullPage: true,
      caret: "initial",
    });
  }
  await page.goto("/acordos");
  await expect(
    page.getByRole("heading", { name: "Repasses confirmados", exact: true }),
  ).toBeVisible();
  await expect(heading("Confirmado")).toBeVisible();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.impeccable/review/offer-confirmations-${width}.png`,
      fullPage: true,
      caret: "initial",
    });
  }
  await expect(
    page.getByText("Acordo registrado", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("link", {
      name: "Acordos registrados e pagamentos",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/acordos\/registrados$/, {
    timeout: 30000,
  });
  await expect(heading("Confirmado")).toHaveCount(0);
  await page.goto(`/acordos/${records![0].id}`);
  await expect(
    page.getByRole("heading", { name: "Repasse confirmado", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Origem: oferta publicada no Repassafe."),
  ).toBeVisible();
});
