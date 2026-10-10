/**
 * @archivo tests/browser/market-route.spec.ts
 * @proposito Verificar la ruta de mercado autenticada y sus estados de lectura.
 * @responsabilidades Cubrir regresiones visibles de mercado con respuestas sintéticas, sin operar cuentas ni ofertas reales.
 * @ubicacion tests/browser dentro de la verificación de integración de QvaPay-AI.
 */
import { expect, test, type Page } from "@playwright/test";

const smokeHeaders = {
  authorization: "Bearer local-browser-test-smoke",
};

function scannerState(overrides: Record<string, unknown> = {}) {
  const now = Date.now();
  const buyOffer = {
    id: "test-buy-1",
    side: "BUY",
    rate: "1000",
    amount: "12",
    availableAmount: "8",
    status: "open",
    createdAt: new Date(now - 60_000).toISOString(),
    creatorUsername: "comprador-prueba",
    creatorVip: true,
    onlyVip: false,
    fiatAmount: "12000",
    observedAt: new Date(now).toISOString(),
  };
  const sellOffer = {
    id: "test-sell-1",
    side: "SELL",
    rate: "1001",
    amount: "15",
    availableAmount: "9",
    status: "open",
    createdAt: new Date(now - 30_000).toISOString(),
    creatorUsername: "vendedor-prueba",
    creatorVip: false,
    onlyVip: false,
    fiatAmount: "15015",
    observedAt: new Date(now).toISOString(),
  };
  return {
    configured: true,
    coin: "QUSD",
    intervalSeconds: 10,
    nextAlarmAt: now + 10_000,
    serverNowAt: now,
    running: false,
    snapshotStatus: "AVAILABLE",
    lastStartedAt: new Date(now - 2_000).toISOString(),
    lastCompletedAt: new Date(now - 1_000).toISOString(),
    lastError: null,
    metrics: {
      totalOffers: 2,
      buyOffers: 1,
      sellOffers: 1,
      totalAvailableAmount: "17",
      bestBuyRate: "1000",
      bestSellRate: "1001",
      spread: "1",
      spreadPercent: 0.1,
      crossedMarket: false,
      snapshotAt: new Date(now).toISOString(),
    },
    buyOffers: [buyOffer],
    sellOffers: [sellOffer],
    ...overrides,
  };
}

async function authenticate(page: Page): Promise<void> {
  await page.goto("/");
  const username = `ci-market-${crypto.randomUUID()}`;
  const password = "BrowserMarket-Pass-2026!";
  const created = await page.request.post("/internal/auth/smoke-user", {
    headers: smokeHeaders,
    data: { username, password },
  });
  expect(created.status()).toBe(200);

  const login = await page.request.post("/api/auth/login", {
    data: { username, password },
  });
  expect(login.status()).toBe(200);
  const setCookie = login.headers()["set-cookie"] ?? "";
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
}

test("el mercado autenticado muestra los dos libros en modo de solo lectura", async ({
  page,
}) => {
  const payload = scannerState();
  await page.route("**/api/scanner/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: JSON.stringify(payload),
    }),
  );
  await authenticate(page);
  const response = await page.goto("/app/mercado");

  expect(response?.status()).toBe(200);
  await expect(page.locator("body")).toHaveAttribute("data-module", "mercado");
  await expect(page.getByRole("heading", { name: "Mercado P2P" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /SELL.*acción Comprar/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /BUY.*acción Vender/ })).toBeVisible();
  await expect(page.locator("#marketIntegrity")).toContainText("ACTUAL");
  await expect(page.locator("#sellTable")).toContainText("vendedor-prueba");
  await expect(page.locator("#buyTable")).toContainText("comprador-prueba");
  await expect(page.locator("#sellTable")).toContainText("1,001.00");
  await expect(page.locator("#buyTable")).toContainText("1,000.00");
  await expect(page.getByRole("button", { name: /Comprar|Vender/ })).toHaveCount(0);
  await expect(page.locator("#sellTable table caption")).toHaveCount(0);
});

test("el mercado identifica explícitamente un snapshot no disponible", async ({
  page,
}) => {
  const payload = scannerState({
    snapshotStatus: "UNAVAILABLE",
    metrics: {
      totalOffers: 0,
      buyOffers: 0,
      sellOffers: 0,
      totalAvailableAmount: "0",
      bestBuyRate: null,
      bestSellRate: null,
      spread: null,
      spreadPercent: null,
      crossedMarket: false,
      snapshotAt: null,
    },
    buyOffers: [],
    sellOffers: [],
  });
  await page.route("**/api/scanner/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: JSON.stringify(payload),
    }),
  );
  await authenticate(page);
  await page.goto("/app/mercado");

  await expect(page.locator("#marketIntegrity")).toContainText("NO DISPONIBLE");
  await expect(page.locator("#sellTable")).toContainText("No hay ofertas");
  await expect(page.locator("#buyTable")).toContainText("No hay ofertas");
});

test("el módulo de mercado no desborda el viewport móvil estrecho", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await authenticate(page);
  await page.goto("/app/mercado");
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));

  expect(dimensions.document, JSON.stringify(dimensions)).toBeLessThanOrEqual(
    dimensions.viewport,
  );
});
