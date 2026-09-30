import { expect as baseExpect, test } from "@playwright/test";
const expect = baseExpect.configure({ timeout: 30000 });
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { mkdirSync } from "node:fs";

const evidence = ".impeccable/review";
function totp(secret: string) {
  const bits = [...secret.toUpperCase()]
    .map((c) =>
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
        .indexOf(c)
        .toString(2)
        .padStart(5, "0"),
    )
    .join("");
  const key = Buffer.from(
    bits.match(/.{8}/g)!.map((byte) => parseInt(byte, 2)),
  );
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac("sha1", key).update(counter).digest();
  const offset = hash[19] & 15;
  return String((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(
    6,
    "0",
  );
}
test("menu móvel oferece navegação, fecha com Escape e identifica dados de exemplo", async ({
  page,
}) => {
  test.setTimeout(120000);
  mkdirSync(evidence, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const trigger = page.getByRole("button", { name: "Abrir menu" });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const menu = page.getByRole("navigation", { name: "Navegação móvel" });
  await expect(
    menu.getByRole("link", { name: "Entrar", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `${evidence}/home-mobile.png`,
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Exemplo de acordo" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: `${evidence}/home-desktop.png`,
    fullPage: true,
  });
});

test("administração independente: MFA, navegação, busca e feedback de alteração", async ({
  page,
}) => {
  test.setTimeout(300000);
  test.skip(
    process.env.RUN_LOCAL_REGISTRATION !== "true",
    "Exige Supabase local com dados sintéticos.",
  );
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const unique = Date.now();
  const email = `design-admin-${unique}@example.test`;
  const password = `Local-${crypto.randomUUID()}`;
  const { data: account, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  expect(error).toBeNull();
  const userId = account.user!.id;
  const { error: grantError } = await admin
    .from("administrative_access")
    .insert({
      user_id: userId,
      active: true,
      reason: "Teste sintético local de navegação e design",
    });
  expect(grantError).toBeNull();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId);
  expect(profile).toEqual([]);
  await page.goto("/entrar", { waitUntil: "domcontentloaded" });
  await page.getByLabel("E-mail ou celular confirmado").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/mfa$/, { timeout: 30000 });
  const manual = page.getByText("Entrada manual:");
  await expect(manual).toBeVisible({ timeout: 30000 });
  const secret = (await manual.locator("code").textContent())!.trim();
  await page.getByLabel("Código do autenticador").fill(totp(secret));
  await page.getByRole("button", { name: "Ativar MFA" }).click();
  await expect(page).toHaveURL(/\/admin\/cadastros$/, { timeout: 30000 });
  const nav = page.getByRole("navigation", { name: "Áreas da administração" });
  await expect(
    nav.getByRole("link", { name: "Fila de cadastros" }),
  ).toHaveAttribute("aria-current", "page");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: `${evidence}/admin-desktop.png`,
    fullPage: true,
  });
  if (await page.locator(".admin-record").count()) {
    await page.locator(".admin-record summary").first().click();
    await page.screenshot({
      path: `${evidence}/cadastro-review-desktop.png`,
      fullPage: true,
    });
  }
  await nav.getByRole("link", { name: "Instituições e grupos" }).click();
  await expect(
    page.getByRole("heading", { name: "Instituições e grupos", exact: true }),
  ).toBeVisible();
  const institution = page.locator("form").filter({
    has: page.getByRole("button", { name: "Criar instituição", exact: true }),
  });
  await institution
    .getByLabel("Nome", { exact: true })
    .fill(`Instituição sintética ${unique}`);
  await institution
    .getByRole("button", { name: "Criar instituição", exact: true })
    .click();
  await expect(institution.getByRole("status")).toHaveText(
    "Alteração registrada.",
  );
  await page.screenshot({
    path: `${evidence}/instituicoes-desktop.png`,
    fullPage: true,
  });
  await nav.getByRole("link", { name: "Pessoas", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Pessoas e verificações anteriores",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("searchbox").fill(`sem-resultado-${unique}`);
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(
    page.getByText("Nenhuma pessoa corresponde aos filtros."),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await nav.getByRole("link", { name: "Fila de cadastros" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Verificação de cadastros",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: `${evidence}/admin-mobile.png`,
    fullPage: true,
  });
  if (await page.locator(".admin-record").count()) {
    await page.locator(".admin-record summary").first().click();
    await page.screenshot({
      path: `${evidence}/cadastro-review-mobile.png`,
      fullPage: true,
    });
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  for (const [name, heading] of [
    ["Ocorrências", "Ocorrências abertas"],
    ["Suporte e privacidade", "Solicitações de suporte"],
    ["Auditoria", "Auditoria"],
    ["Operação", "Consulta operacional"],
  ]) {
    await nav.getByRole("link", { name, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await admin
    .from("administrative_access")
    .update({ active: false })
    .eq("user_id", userId);
});
