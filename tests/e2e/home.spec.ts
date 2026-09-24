import { expect, test } from "@playwright/test";
test("apresenta o fluxo do MVP e os acessos principais", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Passagem segura, do anúncio ao acordo",
  );
  await expect(
    page.getByText(/Publique plantões, receba candidaturas/),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Entrar na plataforma" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Solicitar acesso" }),
  ).toBeVisible();
});
