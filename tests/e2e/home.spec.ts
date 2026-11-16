import { expect, test } from "@playwright/test";
test("apresenta o fluxo do MVP e os acessos principais", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Repasse seu plantão com clareza e segurança.",
  );
  await expect(
    page.getByText(/Encontre um médico com CRM verificado/),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Entrar na plataforma" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Criar conta" }).first(),
  ).toBeVisible();
});

test("abre as perguntas frequentes e leva ao guia", async ({ page }) => {
  await page.goto("/");
  const faq = page.locator("#perguntas");
  await expect(
    faq.getByRole("heading", { level: 2, name: "Perguntas frequentes" }),
  ).toBeVisible();
  const answer = faq.getByText(/O Repassafe não intermedeia pagamentos\./);
  await expect(answer).toBeHidden();
  await faq.getByText("O Repassafe intermedeia o pagamento?").click();
  await expect(answer).toBeVisible();

  await faq.getByRole("link", { name: /Leia o guia/ }).click();
  await expect(page).toHaveURL(/\/repasse-de-plantao$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Como repassar um plantão médico com segurança",
  );
  await expect(
    page.getByRole("link", { name: /Código de Ética Médica/ }),
  ).toBeVisible();
});
