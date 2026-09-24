import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("mantém navegação pública utilizável em viewport móvel", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Entrar na plataforma" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Solicitar acesso" }),
  ).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("permite percorrer entrada e cadastro por teclado", async ({ page }) => {
  await page.goto("/entrar");

  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();

  await page.getByLabel("E-mail").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Senha")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Entrar" })).toBeFocused();

  await page.getByRole("link", { name: "Solicitar cadastro" }).click();
  await expect(
    page.getByRole("heading", { name: "Solicitar cadastro" }),
  ).toBeVisible();
  await expect(page.getByLabel("Nome profissional")).toBeVisible();
  await expect(page.getByLabel("CRM")).toBeVisible();
  await expect(page.getByLabel("UF")).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
