import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

test("perfil consultável por teclado sem escolher, confirmar ou perder a seleção", async ({
  page,
}) => {
  test.setTimeout(120000);
  mkdirSync("test-results/candidate-profile", { recursive: true });
  for (const width of [1440, 390, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/dev/telas/s08");
    const submit = page.getByRole("button", {
      name: "Selecionar e revisar condições",
    });
    const summaries = page.locator("summary");
    const radios = page.getByRole("radio");
    await expect(submit).toBeDisabled();
    await radios.first().focus();
    await page.keyboard.press("Tab");
    await expect(summaries.first()).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", {
        name: "Perfil profissional de Dra. Ana Moreira",
      }),
    ).toBeVisible();
    await expect(radios.first()).not.toBeChecked();
    await expect(submit).toBeDisabled();
    await page.keyboard.press("Space");
    await expect(
      page.getByRole("heading", {
        name: "Perfil profissional de Dra. Ana Moreira",
      }),
    ).not.toBeVisible();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Space");
    await expect(radios.first()).toBeChecked();
    await summaries.nth(1).click();
    await expect(
      page.getByRole("heading", {
        name: "Perfil profissional de Dr. Rafael Souza",
      }),
    ).toBeVisible();
    await expect(radios.first()).toBeChecked();
    await expect(radios.nth(1)).not.toBeChecked();
    await expect(submit).toBeEnabled();
    await expect(page).toHaveURL(/\/dev\/telas\/s08$/);
    expect(
      await summaries
        .nth(1)
        .evaluate((el) => el.getBoundingClientRect().height),
    ).toBeGreaterThanOrEqual(44);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `test-results/candidate-profile/details-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("heading", { name: "Perfil profissional de Dr. Rafael Souza" })
      .evaluate((el) => el.scrollIntoView({ block: "start" }));
    await expect(
      page.getByText(/não concede autorização institucional/).nth(1),
    ).toBeVisible();
    await page.screenshot({
      path: `test-results/candidate-profile/reading-${width}.png`,
    });
    await page.goto("/dev/telas/s09-titular");
    await page.locator("summary").click();
    await expect(
      page.getByRole("heading", {
        name: "Perfil profissional de Dra. Ana Moreira",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Selecionar e enviar ao substituto" }),
    ).toBeVisible();
    await page.screenshot({
      path: `test-results/candidate-profile/review-${width}.png`,
      fullPage: true,
    });
    if (width === 360) {
      await page.goto("/dev/telas/s08");
      await page.addStyleTag({ content: ":root { font-size: 200%; }" });
      await page.locator("summary").first().click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  }
});
