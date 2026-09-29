import { expect, test } from "@playwright/test";

test("exibe entrada e cadastro da beta privada", async ({ page }) => {
  await page.goto("/entrar");
  await expect(
    page.getByRole("heading", { name: "Entrar na plataforma" }),
  ).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();

  await page.getByRole("link", { name: "Solicitar cadastro" }).click();
  await expect(
    page.getByRole("heading", { name: "Solicitar cadastro" }),
  ).toBeVisible();
  await expect(page.getByLabel("CRM")).toBeVisible();
  await expect(page.getByLabel("UF")).toBeVisible();
});

test("protege a configuração MFA sem sessão", async ({ page }) => {
  await page.goto("/mfa");
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(
    page.getByRole("heading", { name: "Entrar na plataforma" }),
  ).toBeVisible();
});
