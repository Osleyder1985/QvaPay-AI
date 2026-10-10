/**
 * @archivo tests/browser/market-route.spec.ts
 * @proposito Verificar la ruta de mercado autenticada y sus estados de lectura.
 * @responsabilidades Cubrir regresiones visibles de mercado con respuestas sintéticas, sin operar cuentas ni ofertas reales.
 * @ubicacion tests/browser dentro de la verificación de integración de QvaPay-AI.
 */
import * as AxeBuilderModule from "@axe-core/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

type AxeAudit = {
  violations: Array<{
    id: string;
    impact?: string | null;
    help: string;
    nodes: Array<{ target: string[] }>;
  }>;
};

type AxeBuilderInstance = {
  withTags(tags: string[]): AxeBuilderInstance;
  analyze(): Promise<AxeAudit>;
};

const AxeBuilder = AxeBuilderModule.default as unknown as new (options: {
  page: unknown;
}) => AxeBuilderInstance;

async function expectNoAccessibilityViolations(
  page: unknown,
  context: string,
): Promise<void> {
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const violations = audit.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target),
  }));
  expect(violations, `Violaciones Axe: ${context}`).toEqual([]);
}

const smokeHeaders = {
  authorization: "Bearer local-browser-test-smoke",
};

const smokeUsers = new Map<string, string>();

test.afterEach(async ({ page }, testInfo) => {
  const username = smokeUsers.get(testInfo.testId);
  if (!username) return;
  smokeUsers.delete(testInfo.testId);
  const deleted = await page.request.delete("/internal/auth/smoke-user", {
    headers: {
      ...smokeHeaders,
      origin: "http://127.0.0.1:8787",
    },
    data: { username },
  });
  expect(deleted.status()).toBe(204);
});

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
    coin: "BANK_CUP",
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

async function authenticate(page: Page, testInfo: TestInfo): Promise<void> {
  await page.goto("/");
  const username = `ci-smoke-${crypto.randomUUID()}`;
  const password = "BrowserMarket-Pass-2026!";
  const created = await page.request.post("/internal/auth/smoke-user", {
    headers: smokeHeaders,
    data: { username, password },
  });
  expect(created.status()).toBe(200);
  smokeUsers.set(testInfo.testId, username);

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

test("el mercado conserva un estado de carga explícito hasta recibir el snapshot", async ({
  page,
}, testInfo) => {
  let releaseResponse!: () => void;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  let intercepted = false;
  await page.route("**/api/scanner/status", async (route) => {
    intercepted = true;
    await responseGate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: JSON.stringify(scannerState()),
    });
  });
  await authenticate(page, testInfo);
  await page.goto("/app/mercado");

  await expect(page.locator("#marketIntegrity")).toBeVisible();
  await expect(page.locator("#marketIntegrity")).toHaveText(
    "Esperando validación de integridad del snapshot.",
  );
  expect(intercepted).toBe(true);

  releaseResponse();
  await expect(page.locator("#marketIntegrity")).toContainText("ACTUAL");
  await expect(page.locator("#sellTable")).toContainText("vendedor-prueba");
});

test("el mercado autenticado muestra los dos libros en modo de solo lectura", async ({
  page,
}, testInfo) => {
  const payload = scannerState();
  await page.route("**/api/scanner/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: JSON.stringify(payload),
    }),
  );
  await authenticate(page, testInfo);
  const response = await page.goto("/app/mercado");

  expect(response?.status()).toBe(200);
  await expect(page.locator("body")).toHaveAttribute("data-module", "mercado");
  await expect(page.locator("#page-title")).toHaveText("Mercado P2P");
  await expect(
    page.getByRole("heading", { name: /SELL.*acción Comprar/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /BUY.*acción Vender/ }),
  ).toBeVisible();
  await expect(page.locator("#marketIntegrity")).toContainText("ACTUAL");
  await expect(page.locator("#sellTable")).toContainText("vendedor-prueba");
  await expect(page.locator("#buyTable")).toContainText("comprador-prueba");
  await expect(page.locator("#sellTable")).toContainText("1,001.00");
  await expect(page.locator("#buyTable")).toContainText("1,000.00");
  await expect(
    page.getByRole("button", { name: /Comprar|Vender/ }),
  ).toHaveCount(0);
  await expect(page.locator("#sellTable table caption")).toHaveText(
    "Ofertas SELL · Comprar · Mercado BANK_CUP",
  );
  await expect(page.locator("#sellTable thead")).toContainText(
    "TASA (CUP/QUSD)",
  );
  await expect(page.locator("#sellTable thead")).toContainText("CUP a pagar");
  await expect(page.locator("#buyTable table caption")).toHaveText(
    "Ofertas BUY · Vender · Mercado BANK_CUP",
  );
  await expect(page.locator("#buyTable thead")).toContainText(
    "TASA (CUP/QUSD)",
  );
  await expect(page.locator("#buyTable thead")).toContainText("CUP a recibir");
  for (const selector of ["#sellTable table", "#buyTable table"]) {
    const headers = page.locator(`${selector} thead th`);
    await expect(headers).toHaveCount(8);
    for (let index = 0; index < 8; index += 1) {
      await expect(headers.nth(index)).toHaveAttribute("scope", "col");
    }
  }
});

test("los valores monetarios ausentes de BANK_CUP no se representan como cero", async ({
  page,
}, testInfo) => {
  const payload = scannerState();
  const firstBuyOffer = payload.buyOffers[0];
  if (!firstBuyOffer)
    throw new Error("La fixture BANK_CUP requiere una oferta BUY.");
  Object.assign(firstBuyOffer, { amount: null, fiatAmount: "   " });
  await page.route("**/api/scanner/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: JSON.stringify(payload),
    }),
  );
  await authenticate(page, testInfo);
  await page.goto("/app/mercado");

  await expect(page.locator("#buyTable tbody tr td:nth-child(3)")).toHaveText(
    "—",
  );
  await expect(page.locator("#buyTable tbody tr td:nth-child(5)")).toHaveText(
    "—",
  );
});

test("el mercado identifica explícitamente un snapshot no disponible", async ({
  page,
}, testInfo) => {
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
  await authenticate(page, testInfo);
  await page.goto("/app/mercado");

  await expect(page.locator("#marketIntegrity")).toContainText("NO DISPONIBLE");
  await expect(page.locator("#sellTable")).toContainText("No hay ofertas");
  await expect(page.locator("#buyTable")).toContainText("No hay ofertas");
});

test("el mercado aísla el desplazamiento de tablas sin desbordar la página", async ({
  page,
}, testInfo) => {
  await page.route("**/api/scanner/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: JSON.stringify(scannerState()),
    }),
  );
  await authenticate(page, testInfo);
  await page.goto("/app/mercado");

  for (const width of [320, 360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      const scrollers = Array.from(
        document.querySelectorAll<HTMLElement>("#sellTable, #buyTable"),
      ).map((element) => {
        const rect = element.getBoundingClientRect();
        const panel = element.closest(".tablepanel");
        const panelRect = panel?.getBoundingClientRect();
        return {
          id: element.id,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          overflowX: getComputedStyle(element).overflowX,
          panelRight: panelRect ? Math.round(panelRect.right) : null,
        };
      });
      return {
        viewport,
        document: document.documentElement.scrollWidth,
        scrollers,
      };
    });
    expect(
      dimensions.document,
      `Desbordamiento de página a ${width}px: ${JSON.stringify(dimensions)}`,
    ).toBeLessThanOrEqual(dimensions.viewport);

    for (const scroller of dimensions.scrollers) {
      expect(
        scroller.left,
        `${scroller.id} sale por la izquierda`,
      ).toBeGreaterThanOrEqual(-1);
      expect(
        scroller.right,
        `${scroller.id} sale por la derecha: ${JSON.stringify(scroller)}`,
      ).toBeLessThanOrEqual(dimensions.viewport + 1);
      expect(
        scroller.panelRight,
        `El panel de ${scroller.id} sale del viewport`,
      ).toBeLessThanOrEqual(dimensions.viewport + 1);
      expect(["auto", "scroll"]).toContain(scroller.overflowX);
      if (width < 960) {
        expect(
          scroller.scrollWidth,
          `${scroller.id} debe permitir desplazamiento horizontal interno`,
        ).toBeGreaterThan(scroller.clientWidth);
      }
    }
  }
});

test("el estado del mercado se recupera después de un error de transporte", async ({
  page,
}, testInfo) => {
  let attempts = 0;
  await page.route("**/api/scanner/status", (route) => {
    attempts += 1;
    if (attempts === 1) {
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "fallo sintético de prueba" }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: JSON.stringify(scannerState()),
    });
  });
  await authenticate(page, testInfo);
  await page.goto("/app/mercado");
  await expect(page.locator("#liveText")).toHaveText("SIN CONEXIÓN");

  await page.reload();
  await expect(page.locator("#marketIntegrity")).toContainText("ACTUAL");
  await expect(page.locator("#sellTable")).toContainText("vendedor-prueba");
  expect(attempts).toBeGreaterThanOrEqual(2);
});

test("la ruta de mercado supera el análisis automatizado de accesibilidad", async ({
  page,
}, testInfo) => {
  await page.route("**/api/scanner/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: JSON.stringify(scannerState()),
    }),
  );
  await authenticate(page, testInfo);
  await page.goto("/app/mercado");
  await expect(page.locator("#marketIntegrity")).toContainText("ACTUAL");

  await expectNoAccessibilityViolations(
    page,
    "mercado con snapshot disponible",
  );
});

test("la navegación por teclado puede alcanzar el control de cierre de sesión", async ({
  page,
}, testInfo) => {
  await page.route("**/api/scanner/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: JSON.stringify(scannerState()),
    }),
  );
  await authenticate(page, testInfo);
  await page.goto("/app/mercado");

  let reachedLogout = false;
  for (let index = 0; index < 40; index += 1) {
    await page.keyboard.press("Tab");
    if (
      await page
        .locator("#logoutButton")
        .evaluate((element) => element === document.activeElement)
    ) {
      reachedLogout = true;
      break;
    }
  }
  expect(
    reachedLogout,
    "El control de cierre debe ser alcanzable con Tab",
  ).toBe(true);
  await expect(page.locator("#logoutButton")).toBeFocused();
});

test("un snapshot con error operativo se marca degradado y no accionable", async ({
  page,
}, testInfo) => {
  const payload = scannerState({
    lastError: "fallo sintético de lectura",
  });
  await page.route("**/api/scanner/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "no-store" },
      body: JSON.stringify(payload),
    }),
  );
  await authenticate(page, testInfo);
  await page.goto("/app/mercado");

  await expect(page.locator("#marketIntegrity")).toContainText("DEGRADADO");
  await expect(page.locator("#liveText")).toHaveText("DEGRADADO");
  await expect(
    page.locator("#sellTable [aria-label^='Acción no disponible']"),
  ).toBeVisible();
  await expect(
    page.locator("#buyTable [aria-label^='Acción no disponible']"),
  ).toBeVisible();
  await expect(
    page.locator("#sellTable [aria-label^='Acción no disponible']"),
  ).toContainText("DEGRADADO");
  await expect(
    page.locator("#buyTable [aria-label^='Acción no disponible']"),
  ).toContainText("DEGRADADO");
});
