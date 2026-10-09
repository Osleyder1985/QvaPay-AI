import { expect, test } from "@playwright/test";

const protectedRoutes = [
  "/app/inicio",
  "/app/cuenta",
  "/app/mercado",
  "/app/arbitraje",
  "/app/operaciones",
  "/app/usuarios",
  "/app/seguridad",
  "/app/monitor",
  "/app/configuracion",
];

test("las rutas modulares sin sesión muestran el acceso y no datos privados", async ({
  page,
}) => {
  for (const route of protectedRoutes) {
    const response = await page.goto(route);

    expect(response?.status(), route).toBe(200);
    await expect(
      page.getByRole("button", { name: "Iniciar sesión" }),
    ).toBeVisible();
    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#accountBalance")).toHaveCount(0);
    await expect(page.locator("#coin")).toHaveCount(0);
  }
});

test("se rechazan módulos desconocidos y métodos no admitidos", async ({
  request,
}) => {
  const unknown = await request.get("/app/no-existe");
  expect(unknown.status()).toBe(404);

  const unsupportedMethod = await request.post("/app/inicio");
  expect(unsupportedMethod.status()).toBe(405);
});

for (const viewport of [
  { name: "móvil", width: 360, height: 800 },
  { name: "tableta", width: 768, height: 1024 },
  { name: "escritorio", width: 1440, height: 900 },
]) {
  test(`la vista de acceso no se desborda horizontalmente en ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: "Iniciar sesión" }),
    ).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    const hasHorizontalOverflow = dimensions.document > dimensions.viewport;
    expect(hasHorizontalOverflow, JSON.stringify(dimensions)).toBe(false);
  });
}

test("el formulario de acceso es navegable con teclado", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator("#username")).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.locator("#password")).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Iniciar sesión" }),
  ).toBeFocused();
});

test("el shell autenticado mantiene rutas, recarga, diseño adaptable y movimiento reducido", async ({
  page,
}) => {
  await page.goto("/");
  const username = `ci-smoke-${crypto.randomUUID()}`;
  const password = "BrowserSmoke-Pass-2026!";
  const smokeHeaders = {
    authorization: "Bearer local-browser-test-smoke",
  };

  const created = await page.request.post("/internal/auth/smoke-user", {
    headers: smokeHeaders,
    data: { username, password },
  });
  expect(created.status()).toBe(200);

  try {
    const login = await page.request.post("/api/auth/login", {
      data: { username, password },
    });
    expect(login.status()).toBe(200);
    const setCookie = login.headers()["set-cookie"] ?? "";
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Strict");
    const cookieValue = setCookie.match(/qvapay_ai_session=([^;]+)/)?.[1];
    expect(cookieValue).toBeTruthy();
    await page.context().addCookies([
      {
        name: "qvapay_ai_session",
        value: cookieValue!,
        url: "http://127.0.0.1:8787",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);

    for (const route of protectedRoutes) {
      const moduleId = route.slice("/app/".length);
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(page.locator("#page-title")).toBeVisible();
      await expect(page.locator(`nav a[href="${route}"]`)).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(page.locator("body")).toHaveAttribute(
        "data-module",
        moduleId,
      );
      await page.reload();
      await expect(page.locator("body")).toHaveAttribute(
        "data-module",
        moduleId,
      );
    }

    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const viewport of [
      { name: "móvil", width: 360, height: 800 },
      { name: "tableta", width: 768, height: 1024 },
      { name: "escritorio", width: 1440, height: 900 },
    ]) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/app/inicio");
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
      }));
      const hasHorizontalOverflow = dimensions.document > dimensions.viewport;
      expect(
        hasHorizontalOverflow,
        `${viewport.name}: ${JSON.stringify(dimensions)}`,
      ).toBe(false);
      const motion = await page.evaluate(() => ({
        reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        duration: getComputedStyle(document.querySelector(".dot")!)
          .animationDuration,
      }));
      expect(motion.reduced).toBe(true);
      expect(Number.parseFloat(motion.duration)).toBeLessThanOrEqual(0.00001);
    }
  } finally {
    const removed = await page.request.delete("/internal/auth/smoke-user", {
      headers: smokeHeaders,
      data: { username },
    });
    expect(removed.status()).toBe(204);
  }
});
