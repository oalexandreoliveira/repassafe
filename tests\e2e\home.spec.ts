import { expect, test } from "@playwright/test";
test("exibe a fundação sem fluxo de publicação", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Passagem segura",
  );
  await expect(
    page.getByText(/publicação de plantões ainda não/),
  ).toBeVisible();
});
