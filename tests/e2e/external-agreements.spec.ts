import { test, expect, type Browser, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";

// Explicit opt-in: these tests create synthetic accounts and immutable evidence
// exclusively on the local Supabase. Never run against a hosted project.
const enabled = process.env.RUN_EXTERNAL_AGREEMENT_E2E === "1";
if (enabled) process.loadEnvFile(".env.local");
test.skip(!enabled, "Requires local Supabase and RUN_EXTERNAL_AGREEMENT_E2E=1");
test.setTimeout(120000);

async function fixture(browser: Browser, suffix: number) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname))
    throw new Error("Only a local database is permitted");
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const email = `agreement-${randomUUID()}@example.test`;
  const password = `Test-${randomUUID()}!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(error?.message);
  const id = data.user.id;
  const crm = String(Math.floor(Math.random() * 90000000) + 10000000);
  const { error: draftError } = await admin.rpc("registration_save", {
    target_user: id,
    expected_revision: 0,
    draft_data: {
      civilName: `Pessoa Sintética ${suffix}`,
      displayName: `Médico de teste ${suffix}`,
      cpf: String(Math.floor(Math.random() * 90000000000) + 10000000000),
      birthDate: "1990-01-01",
      phone: `+55989${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      practicesMedicine: "yes",
      crmNumber: crm,
      crmState: "MA",
    },
  });
  if (draftError) throw new Error(draftError.message);
  const { error: profileError } = await admin.from("profiles").insert({
    id,
    display_name: `Médico de teste ${suffix}`,
    role: "doctor",
    status: "pending",
    crm_number: crm,
    crm_state: "MA",
  });
  if (profileError) throw new Error(profileError.message);
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:3100",
    acceptDownloads: true,
  });
  const page = await context.newPage();
  await page.goto("/entrar");
  await page.getByLabel("E-mail ou celular confirmado").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
  return { page, context, email };
}
async function fits(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
test("pending professionals create, accept and record payment with private receipt", async ({
  browser,
}) => {
  const owner = await fixture(browser, 1);
  const substitute = await fixture(browser, 2);
  const stranger = await fixture(browser, 3);
  const page = owner.page;
  try {
    await page.goto("/acordos/registrados/novo");
    await page.getByRole("button", { name: "Conferir acordo" }).click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Revise os campos indicados." }),
    ).toBeFocused();
    await expect(page.getByLabel("Data-limite de pagamento")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await page.getByLabel("Neste plantão, eu vou").selectOption("owner");
    await page
      .getByLabel("E-mail do outro profissional", { exact: true })
      .fill(substitute.email);
    await page
      .getByLabel("Instituição e local")
      .fill("Hospital de demonstração — dados fictícios, São Luís");
    await page.getByLabel("Setor", { exact: true }).fill("UTI");
    const future = new Date(Date.now() + 7 * 86400000)
      .toISOString()
      .slice(0, 10);
    const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    await page.getByLabel("Início", { exact: true }).fill(`${future}T07:00`);
    await page.getByLabel("Término", { exact: true }).fill(`${future}T19:00`);
    await page.getByLabel("Valor total (R$)").fill("1500,00");
    await page.getByLabel("Data-limite de pagamento").fill(due);
    await page.getByLabel("Forma de pagamento", { exact: true }).fill("Pix");
    await page.getByLabel("Confirmo meus dados").check();
    await page.getByRole("button", { name: "Conferir acordo" }).click();
    await page.getByRole("button", { name: "Voltar e corrigir" }).click();
    mkdirSync(".impeccable/review", { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: ".impeccable/review/agreement-desktop.png",
      fullPage: true,
    });
    await fits(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await fits(page);
    await page.screenshot({
      path: ".impeccable/review/agreement-mobile.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 320, height: 740 });
    await fits(page);
    await page.getByRole("button", { name: "Conferir acordo" }).click();
    await expect(
      page.getByRole("heading", { name: "Confira antes de enviar" }),
    ).toBeFocused();
    await page.getByRole("button", { name: "Voltar e corrigir" }).click();
    await expect(page.getByLabel("Valor total (R$)")).toHaveValue("1500,00");
    await page.getByRole("button", { name: "Conferir acordo" }).click();
    await page.getByRole("button", { name: "Aceitar e criar convite" }).click();
    await expect(page).toHaveURL(/\/acordos\/registrados\/[a-f0-9-]{36}$/);
    const href = page.url();
    await expect(
      page.getByText("Aguardando confirmação", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Compartilhar no WhatsApp" }),
    ).toHaveAttribute("href", /^https:\/\/wa.me\//);
    await stranger.page.goto(href);
    await expect(
      stranger.page.getByRole("heading", {
        name: "Convite indisponível para esta conta",
      }),
    ).toBeVisible();
    await substitute.page.goto(href);
    await substitute.page.getByLabel("Li e aceito as condições").check();
    await substitute.page
      .getByRole("button", { name: "Aceitar acordo", exact: true })
      .click();
    await expect(
      substitute.page.getByText("Acordo confirmado", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await page.getByText("Informar pagamento", { exact: true }).click();
    await page
      .getByLabel("Data do pagamento", { exact: true })
      .fill(new Date(Date.now() - 86400000).toISOString().slice(0, 10));
    await page.getByLabel("Comprovante (opcional").setInputFiles({
      name: "comprovante.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRzQAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await page
      .getByRole("button", { name: "Informei o pagamento", exact: true })
      .click();
    await expect(
      page.getByText("Pagamento informado — aguardando recebimento", {
        exact: true,
      }),
    ).toBeVisible();
    await substitute.page.reload();
    const download = substitute.page.waitForEvent("download");
    const receiptLink = substitute.page.getByRole("link", {
      name: "Baixar comprovante",
    });
    const receiptUrl = await receiptLink.getAttribute("href");
    await receiptLink.click();
    expect((await download).suggestedFilename()).toBe("comprovante.png");
    expect((await stranger.page.request.get(receiptUrl!)).status()).toBe(404);
    await substitute.page
      .getByLabel("Confirmo que recebi o valor total")
      .check();
    await substitute.page
      .getByRole("button", { name: "Recebi", exact: true })
      .click();
    await expect(
      substitute.page
        .getByText("Recebimento confirmado", { exact: true })
        .first(),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("Recebimento confirmado", { exact: true }).first(),
    ).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: ".impeccable/review/agreement-record-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await fits(page);
    await page.screenshot({
      path: ".impeccable/review/agreement-record-mobile.png",
      fullPage: true,
    });
  } finally {
    await owner.context.close();
    await substitute.context.close();
    await stranger.context.close();
  }
});
