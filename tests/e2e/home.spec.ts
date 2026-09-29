import { expect, test } from "@playwright/test";
test("apresenta o fluxo do MVP e os acessos principais", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Repasse seu plantão com clareza e segurança.",
  );
  await expect(
    page.getByText(/Encontre um profissional elegível/),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Entrar na plataforma" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Solicitar acesso" }).first(),
  ).toBeVisible();
});
