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
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "QvaPay-AI" })).toBeVisible();
    await expect(page.locator("#accountBalance")).toHaveCount(0);
    await expect(page.locator("#coin")).toHaveCount(0);
  }
});

test("se rechazan módulos desconocidos y métodos no admitidos", async ({ request }) => {
  const unknown = await request.get("/app/no-existe");
  expect(unknown.status()).toBe(404);

  const unsupportedMethod = await request.post("/app/inicio");
  expect(unsupportedMethod.status()).toBe(405);
});

for (const viewport of [
  { name: "mobile", de ancho: 360, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  test(`la vista de acceso no se desborda horizontalmente en ${viewport.name} width`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(dimensions.document, JSON.stringify(dimensions)).toBeLessThanOrEqual(
      dimensions.viewport,
    );
  });
}

test("el formulario de acceso es navegable con teclado", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator("#username")).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.locator("#password")).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeFocused();
});
