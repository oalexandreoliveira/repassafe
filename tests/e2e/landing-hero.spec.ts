import { expect, test } from "@playwright/test";

test("hero demonstra publicação real, permite controle e respeita movimento reduzido", async ({
  page,
}) => {
  test.setTimeout(120000);
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") mutations.push(request.url());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const hero = page.getByRole("region", {
    name: "Repasse seu plantão com clareza e segurança.",
  });
  const demo = page.getByRole("region", {
    name: "Demonstração de publicação de plantão",
  });
  const screen = demo.locator("[data-scene]");
  await expect(hero.getByRole("link", { name: "Criar conta" })).toHaveAttribute(
    "href",
    "/cadastro",
  );
  // Sem imagens raster no hero; o logo oficial é SVG.
  await expect(hero.locator('img:not([src$=".svg"])')).toHaveCount(0);
  await demo.getByRole("button", { name: "Pausar demonstração" }).click();
  const pausedValue = await screen.locator('[name="sector"]').inputValue();
  await page.waitForTimeout(400);
  expect(await screen.locator('[name="sector"]').inputValue()).toBe(
    pausedValue,
  );
  const first = demo.getByRole("tab", { name: "Preencher", exact: true });
  await first.focus();
  await first.press("ArrowRight");
  await expect(demo.getByRole("tab", { name: "Conferir" })).toBeFocused();
  await expect(screen).toContainText("Pagamento em até 30 dias");
  await hero.screenshot({
    path: ".impeccable/review/motion-confirm-desktop.png",
  });
  await page.keyboard.press("End");
  await expect(demo.getByRole("tab", { name: "Publicado" })).toBeFocused();
  await expect(screen.locator("[data-tone]")).toHaveText("Aberto");
  await expect(screen).toContainText("Seu plantão");
  await expect(screen).toHaveAttribute("inert", "");
  await expect(demo.getByRole("tabpanel")).toContainText("ainda depende");
  await demo.getByRole("button", { name: "Repetir demonstração" }).click();
  await expect(screen).toHaveAttribute("data-running", "true");
  await expect(screen.locator('[name="sector"]')).toHaveValue(
    "Clínica médica",
    { timeout: 10000 },
  );
  await demo.getByRole("button", { name: "Pausar demonstração" }).click();
  await hero.screenshot({ path: ".impeccable/review/motion-fill-desktop.png" });
  await demo.getByRole("button", { name: "Reproduzir demonstração" }).click();
  await expect(screen.locator('[name="ownerTermsAcknowledged"]')).toBeChecked({
    timeout: 10000,
  });
  await expect(screen).toHaveAttribute("data-scene", "2", { timeout: 10000 });
  await expect(screen).toHaveAttribute("data-running", "false", {
    timeout: 5000,
  });
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
    expect(
      await screen.evaluate((node) => node.scrollWidth <= node.clientWidth),
    ).toBe(true);
    expect(
      await screen.evaluate((node) => node.scrollHeight <= node.clientHeight),
    ).toBe(true);
    await hero.screenshot({ path: `.impeccable/review/motion-${name}.png` });
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
  await page.evaluate(() => {
    document.documentElement.style.zoom = "1";
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await first.click();
  await expect(screen).toHaveAttribute("data-running", "false");
  await expect(screen.locator('[name="sector"]')).toHaveValue("Clínica médica");
  const datesFit = await screen.evaluate((node) => {
    const inputs = [
      ...node.querySelectorAll<HTMLInputElement>(
        'input[type="date"], input[type="time"]',
      ),
    ];
    return inputs.every((input) => {
      const field = input.getBoundingClientRect();
      const wrapper = input.closest("[data-field]")!.getBoundingClientRect();
      return field.left >= wrapper.left - 1 && field.right <= wrapper.right + 1;
    });
  });
  expect(datesFit).toBe(true);
  await expect(
    demo.getByRole("button", { name: "Pausar demonstração" }),
  ).toHaveCount(0);
  await hero.screenshot({ path: ".impeccable/review/motion-reduced.png" });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const positions = [];
    for (const name of ["Preencher", "Conferir", "Publicado"]) {
      await demo.getByRole("tab", { name, exact: true }).click();
      if (name === "Preencher") {
        expect(
          await screen.evaluate((node) =>
            [
              ...node.querySelectorAll<HTMLInputElement>(
                'input[type="date"], input[type="time"]',
              ),
            ].every(
              (input) =>
                input.getBoundingClientRect().right <=
                input.closest("[data-field]")!.getBoundingClientRect().right +
                  1,
            ),
          ),
        ).toBe(true);
        await hero.screenshot({
          path: `.impeccable/review/motion-fields-${width}.png`,
        });
      }
      positions.push(
        await demo
          .getByText(/Recortes da interface do app/)
          .evaluate(
            (node) => node.getBoundingClientRect().top + window.scrollY,
          ),
      );
    }
    expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(1);
  }
  await demo.getByText("Ler demonstração", { exact: true }).click();
  await expect(
    demo.getByText(/Isso ainda não confirma um repasse/),
  ).toBeVisible();
  expect(mutations).toEqual([]);
});

test("demonstração suspende reprodução fora de vista", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const demo = page.getByRole("region", {
    name: "Demonstração de publicação de plantão",
  });
  const screen = demo.locator("[data-scene]");
  await expect(screen).toHaveAttribute("data-running", "true");
  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(screen).toHaveAttribute("data-running", "false");
  const previous = await screen.locator('[name="sector"]').inputValue();
  await page.waitForTimeout(400);
  expect(await screen.locator('[name="sector"]').inputValue()).toBe(previous);
  await demo.scrollIntoViewIfNeeded();
  await expect(screen).toHaveAttribute("data-running", "true");
});
