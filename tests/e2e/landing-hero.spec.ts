import { expect, test } from "@playwright/test";

test("hero prioriza cadastro e explica o repasse por teclado e toque", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/");
  const hero = page.getByRole("region", {
    name: "Repasse seu plantão com clareza e segurança.",
  });
  await expect(hero.getByRole("link", { name: "Criar conta" })).toHaveAttribute(
    "href",
    "/cadastro",
  );
  await expect(
    hero.getByRole("link", { name: "Como funciona" }),
  ).toHaveAttribute("href", "#como-funciona");
  const image = hero.getByRole("img", { name: /Ilustração de um celular/ });
  await expect
    .poll(() =>
      image.evaluate(
        (element: HTMLImageElement) =>
          element.complete && element.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await page.evaluate(() => document.fonts.ready);
  const first = page.getByRole("tab", { name: "1. Publicação" });
  await first.focus();
  await first.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "2. Candidatura" })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("Receba candidaturas");
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "5. Acordo" })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Após as confirmações e a aprovação exigida",
  );
  await page.getByRole("tab", { name: "4. Aprovação" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Quando o grupo exige",
  );
  await first.click();
  for (const [width, height, name] of [
    [1440, 1000, "desktop"],
    [768, 1024, "tablet"],
    [390, 844, "mobile"],
    [320, 800, "narrow"],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    const rect = await image.boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(width);
    await hero.screenshot({
      path: `.impeccable/review/hero-${name}.png`,
    });
    if (name === "desktop" || name === "mobile") {
      await page.screenshot({
        path: `.impeccable/review/landing-${name}.png`,
        fullPage: true,
      });
    }
  }
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
  await expect(hero.getByRole("link", { name: "Criar conta" })).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.zoom = "1";
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("tab", { name: "5. Acordo" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "as condições ficam registradas",
  );
  expect(
    await page
      .getByRole("tabpanel")
      .locator("svg path")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  await page
    .getByRole("region", {
      name: "Repasse seu plantão com clareza e segurança.",
    })
    .screenshot({ path: ".impeccable/review/hero-reduced-motion.png" });
});
