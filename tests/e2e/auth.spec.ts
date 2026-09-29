import { expect, test } from "@playwright/test";

test("exibe entrada e cadastro da beta privada", async ({ page }) => {
  await page.goto("/entrar");
  await expect(
    page.getByRole("heading", { name: "Entrar na plataforma" }),
  ).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();

  await page.getByRole("link", { name: "Solicitar cadastro" }).click();
  await expect(
    page.getByRole("heading", { name: "Crie sua conta" }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /Termos de uso/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /Política de privacidade/ }),
  ).toBeVisible();
});

test("protege a configuração MFA sem sessão", async ({ page }) => {
  await page.goto("/mfa");
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(
    page.getByRole("heading", { name: "Entrar na plataforma" }),
  ).toBeVisible();
});

test("filas administrativas encaminham visitantes para autenticação", async ({
  page,
}) => {
  for (const route of ["/admin/cadastros", "/admin/suporte"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/entrar$/);
    await expect(
      page.getByRole("button", { name: "Entrar", exact: true }),
    ).toBeVisible();
  }
});
