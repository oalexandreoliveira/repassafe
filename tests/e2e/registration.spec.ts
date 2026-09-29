import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

test("retoma rascunho, envia cadastro e responde a correção em nova versão", async ({
  page,
}) => {
  test.setTimeout(120000);
  test.skip(
    process.env.RUN_LOCAL_REGISTRATION !== "true",
    "Exige Supabase local com chave administrativa efêmera.",
  );
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const email = `registration-${Date.now()}@example.test`;
  const password = `Local-test-${crypto.randomUUID()}`;
  let cpf = Date.now().toString().slice(-9);
  for (let length = 9; length <= 10; length++) {
    const sum = [...cpf].reduce(
      (total, digit, index) => total + Number(digit) * (length + 1 - index),
      0,
    );
    cpf += String((sum * 10) % 11 === 10 ? 0 : (sum * 10) % 11);
  }
  const phone = `119${Date.now().toString().slice(-8)}`;
  const { data: account, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  expect(error).toBeNull();
  const userId = account.user!.id;
  await page.goto("/entrar");
  await page.getByLabel("E-mail ou celular confirmado").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/cadastro\/completar$/);
  await page
    .getByLabel("Nome civil completo")
    .fill("Pessoa sintética de teste");
  await page.getByRole("button", { name: "Salvar progresso" }).click();
  await expect(
    page.getByText("Progresso salvo.", { exact: false }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Nome civil completo")).toHaveValue(
    "Pessoa sintética de teste",
  );
  await page
    .getByLabel("Nome de apresentação", { exact: true })
    .fill("Dra. Teste sintético");
  await page.getByLabel("CPF", { exact: true }).fill(cpf);
  await page.getByLabel("Nascimento", { exact: true }).fill("1990-01-01");
  await page.getByLabel("Celular com DDD").fill(phone);
  await page
    .getByLabel("CRM — para atuação médica")
    .fill(Date.now().toString().slice(-8));
  await page.getByLabel("UF do CRM", { exact: true }).selectOption("SP");
  await page.getByRole("button", { name: "Salvar progresso" }).click();
  await expect(
    page.getByText("Progresso salvo.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Foto profissional", { exact: true }).setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: await sharp({
      create: { width: 128, height: 128, channels: 3, background: "#14403f" },
    })
      .png()
      .toBuffer(),
  });
  await page.getByRole("button", { name: "Salvar foto" }).click();
  await expect(
    page.getByText("Foto salva em armazenamento privado."),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: /Termos de uso/ }).check();
  await page.getByRole("checkbox", { name: /Política de privacidade/ }).check();
  await page.getByRole("button", { name: "Registrar aceite" }).click();
  await expect(
    page.getByText("Aceite registrado.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Enviar para verificação", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Enviado para verificação" }),
  ).toBeDisabled();
  const { data: saved } = await admin.rpc("registration_read", {
    target_user: userId,
  });
  expect(saved.submissions).toHaveLength(1);
  expect(saved.draft.state).toBe("submitted");
  expect(saved.draft.phone).toBe(`+55${phone}`);
  expect(
    (await admin.auth.admin.getUserById(userId)).data.user?.phone_confirmed_at,
  ).toBeFalsy();
  const { data: reviewer } = await admin.auth.admin.createUser({
    email: `reviewer-${Date.now()}@example.test`,
    password,
    email_confirm: true,
  });
  const reviewerId = reviewer.user!.id;
  const { error: grantError } = await admin
    .from("administrative_access")
    .insert({
      user_id: reviewerId,
      reason: "Revisor sintético do cenário local",
    });
  expect(grantError).toBeNull();
  const { error: correctionError } = await admin.rpc("registration_review", {
    target_user: userId,
    reviewer: reviewerId,
    expected_revision: saved.draft.revision,
    decision: "changes_requested",
    corrections: { displayName: "Informe seu nome profissional completo." },
    internal_notes: "Nota interna que nunca aparece ao titular",
    evidence: {},
    verified_rqe: false,
    validity_days: 90,
  });
  expect(correctionError).toBeNull();
  await page.reload();
  await expect(
    page.getByText("Nota interna que nunca aparece ao titular"),
  ).toHaveCount(0);
  await expect(page.getByLabel("Resposta às correções")).toBeVisible();
  await page
    .getByLabel("Nome de apresentação", { exact: true })
    .fill("Dra. Teste sintético completo");
  await page
    .getByLabel("Resposta às correções")
    .fill("Nome atualizado conforme orientação.");
  await page.getByRole("button", { name: "Salvar progresso" }).click();
  await expect(
    page.getByText("Progresso salvo.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Enviar para verificação", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Enviado para verificação" }),
  ).toBeDisabled();
  const { data: corrected } = await admin.rpc("registration_read", {
    target_user: userId,
  });
  expect(corrected.submissions).toHaveLength(2);
  expect(corrected.submissions[1].snapshot.data.displayName).toBe(
    "Dra. Teste sintético",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(
    page.getByRole("img", { name: "Sua foto profissional atual" }),
  ).toBeVisible();
  await expect
    .poll(async () =>
      page
        .getByRole("img", { name: "Sua foto profissional atual" })
        .evaluate((image) => ({
          src: (image as HTMLImageElement).src,
          loaded:
            (image as HTMLImageElement).complete &&
            (image as HTMLImageElement).naturalWidth > 0,
        })),
    )
    .toMatchObject({ loaded: true });
  await page.screenshot({
    path: ".impeccable/review/registration-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    path: ".impeccable/review/registration-mobile.png",
    fullPage: true,
  });
});
