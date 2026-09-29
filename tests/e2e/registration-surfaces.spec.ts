import { expect, test } from "@playwright/test";

test("cadastro, suporte e documentos adaptam-se a celular e ampliação", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const route of ["cadastro", "suporte", "termos", "privacidade"]) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.screenshot({
      path: `.impeccable/review/${route}-desktop.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.impeccable/review/${route}-mobile.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => {
      document.documentElement.style.zoom = "1";
    });
  }
  await page.goto("/suporte");
  await page.getByLabel("E-mail para contato").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Assunto")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Sua solicitação")).toBeFocused();
  await page.goto("/cadastro/foto");
  await expect(page).toHaveURL(/\/entrar$/);
});
