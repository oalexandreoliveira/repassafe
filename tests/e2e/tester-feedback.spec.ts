import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

test("feedback do piloto: modelos, candidatura, pagamento e cadastro em desktop e celular", async ({
  page,
}) => {
  test.setTimeout(180000);
  const folder = "test-results/feedback-visual";
  mkdirSync(folder, { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["s05", "s08", "pagamento", "cadastro-completar"]) {
      await page.goto(`/dev/telas/${route}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      if (route === "s05") {
        await page
          .getByText("Usar um modelo de horários e condições", { exact: true })
          .click();
      }
      if (route === "pagamento") {
        await page
          .getByText("Informar pagamento", { exact: true })
          .first()
          .click();
        await expect(page.getByLabel("Valor pago (R$)")).toHaveValue("1200,00");
        await page
          .getByText("Relatar atraso da fonte pagadora", { exact: true })
          .click();
        await page.getByText("Informar divergência", { exact: true }).click();
        expect(await page.locator('[id="dispute-description"]').count()).toBe(
          1,
        );
        expect(
          await page.locator('[id="source_delay-description"]').count(),
        ).toBe(1);
      }
      if (route === "s08") {
        await expect(page.getByText("CRM 12345/CE")).toBeVisible();
        await page.getByRole("radio").first().check();
        await expect(
          page.getByRole("button", { name: "Selecionar e revisar condições" }),
        ).toBeEnabled();
      }
      if (route === "cadastro-completar") {
        await page
          .getByLabel("Nome civil completo")
          .fill("Nome corrigido do exemplo");
        await expect(
          page.getByRole("button", { name: "Enviar para verificação" }),
        ).toBeDisabled();
        await expect(page.getByText(/Há alterações não salvas/)).toBeVisible();
      }
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `${folder}/${route}-${width}.png`,
        fullPage: true,
      });
    }
  }
});

test("destino interno é preservado na alternância entre entrar e criar conta", async ({
  page,
}) => {
  const next = "/plantoes/10000000-0000-4000-8000-000000000001";
  await page.goto(`/entrar?proximo=${encodeURIComponent(next)}`);
  await page.getByRole("link", { name: /Criar conta/ }).click();
  await expect(page).toHaveURL(new RegExp("cadastro\\?proximo="));
  await expect(page.locator('input[name="next"]')).toHaveValue(next);
});

test("erro devolvido pelo servidor mantém o CRM e recebe foco com teclado", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto("/dev/telas/cadastro-completar");
  for (const label of ["CPF", "Nascimento", "Celular com DDD"])
    await page.getByLabel(label, { exact: true }).fill("");
  const crm = page.getByLabel("CRM — para atuação médica");
  await crm.fill("abc");
  await page.getByRole("button", { name: "Salvar progresso" }).click();
  await expect(crm).toBeEnabled({ timeout: 15000 });
  await expect(crm).toBeFocused();
  await expect(crm).toHaveAttribute("aria-invalid", "true");
  await expect(crm).toHaveValue("abc");
  await page.screenshot({
    path: "test-results/feedback-visual/cadastro-erro-390.png",
  });
  await page.goto("/dev/telas/s05");
  await page.getByLabel("Data-limite de pagamento").focus();
  await page.getByLabel("Data-limite de pagamento").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/feedback-visual/s05-vencimento-390.png",
  });
});
