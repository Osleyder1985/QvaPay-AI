import { describe, expect, it } from "vitest";
import {
  createPublicAppResponse,
  createPublicScannerStateResponse,
  toPublicScannerState,
} from "../../src/infrastructure/cloudflare/public-app.js";
import type {
  ScannerSchedulerRuntimeState,
} from "../../src/infrastructure/cloudflare/scanner-scheduler-do.js";

const marketState: ScannerSchedulerRuntimeState = {
  configured: true,
  coin: "BANK_CUP",
  intervalSeconds: 10,
  nextAlarmAt: Date.now() + 10_000,
  execution: {
    lastStartedAt: "2026-10-05T16:00:00.000Z",
    lastCompletedAt: "2026-10-05T16:00:01.000Z",
    lastError: null,
    lastOfferCount: 4,
    lastBuyCount: 2,
    lastSellCount: 2,
  },
  market: {
    coin: "BANK_CUP",
    offers: [
      {
        id: "buy-low",
        market: "BANK_CUP",
        side: "BUY",
        rate: "999",
        amount: "10",
        availableAmount: "5",
        status: "open",
        sourceTimestamp: "2026-10-05T15:59:00.000Z",
        observedAt: "2026-10-05T16:00:01.000Z",
        createdAt: "2026-10-05T15:49:00.000Z",
        creatorUsername: "buyer-low",
        fiatAmount: "9990",
      },
      {
        id: "buy-best",
        market: "BANK_CUP",
        side: "BUY",
        rate: "1000",
        amount: "10",
        availableAmount: "7",
        status: "open",
        sourceTimestamp: "2026-10-05T15:59:30.000Z",
        observedAt: "2026-10-05T16:00:01.000Z",
        createdAt: "2026-10-05T15:50:00.000Z",
        creatorUsername: "buyer123",
        creatorVip: true,
        onlyVip: true,
        fiatAmount: "10000",
      },
      {
        id: "sell-best",
        market: "BANK_CUP",
        side: "SELL",
        rate: "1001",
        amount: "15",
        availableAmount: "8",
        status: "open",
        sourceTimestamp: "2026-10-05T15:59:20.000Z",
        observedAt: "2026-10-05T16:00:01.000Z",
        createdAt: "2026-10-05T15:50:20.000Z",
        creatorUsername: "seller-best",
        creatorVip: false,
        onlyVip: false,
        fiatAmount: "15015",
      },
      {
        id: "sell-high",
        market: "BANK_CUP",
        side: "SELL",
        rate: "1002",
        amount: "30",
        availableAmount: "9",
        status: "open",
        sourceTimestamp: "2026-10-05T15:59:10.000Z",
        observedAt: "2026-10-05T16:00:01.000Z",
        createdAt: "2026-10-05T15:50:10.000Z",
        creatorUsername: "seller-high",
        fiatAmount: "30060",
      },
    ],
  },
};

describe("public production dashboard", () => {
  it(
    "sirve la ruta inicial sin credenciales ni contenido funcional de otros módulos",
    async () => {
      const response = createPublicAppResponse();
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/html");
      expect(response.headers.get("content-security-policy")).toContain(
        "connect-src 'self'",
      );
      expect(body).toContain("QvaPay-AI");
      expect(body).toContain("MEJOR BUY");
      expect(body).toContain("MEJOR SELL");
      expect(body).toContain("10");
      expect(body).toContain("Dashboard operativo");
      expect(body).toContain("state.serverNowAt-Date.now()");
      expect(body).toContain("setInterval(refresh,1000)");
      expect(body).not.toContain('id="auditoria"');
      expect(body).not.toContain('id="cuenta"');
      expect(body).not.toContain('id="mercado"');
      expect(body).not.toContain("/internal/scanner/start");
      expect(body).not.toContain("setAlarm(");
      expect(body).toContain("/api/account");
      expect(body).not.toContain("x-p2p-action-token");
      expect(body).not.toContain("P2P_ACTION_TOKEN");
      expect(body).not.toContain("Introduce tu clave de operación P2P");
      expect(body).not.toContain("QVAPAY_APP_SECRET");
      expect(body).toContain("ISO/IEC 27001");
      expect(body).not.toContain("SCANNER_BOOTSTRAP_TOKEN");
      expect(body).not.toContain("Server-Side Monitoring");
    },
  );

  it("ships a syntactically valid dashboard client script", async () => {
    const body = await createPublicAppResponse().text();
    const start = body.indexOf("<script>");
    const end = body.indexOf("</script>", start);

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);

    const script = body.slice(start + "<script>".length, end);
    expect(() => new Function(script)).not.toThrow();
    expect(body).not.toContain("applyOffer(");
  });

  it("ranks BUY descending and SELL ascending", () => {
    const state = toPublicScannerState(marketState);

    expect(state.metrics.bestBuyRate).toBe("1000");
    expect(state.metrics.bestSellRate).toBe("1001");
    expect(state.metrics.totalOffers).toBe(4);
    expect(state.metrics.buyOffers).toBe(2);
    expect(state.metrics.sellOffers).toBe(2);
    expect(state.metrics.totalAvailableAmount).toBe("29");
    expect(state.buyOffers[0]?.rate).toBe("1000");
    expect(state.sellOffers[0]?.rate).toBe("1001");
    expect(state.snapshotStatus).toBe("AVAILABLE");
    expect(state.serverNowAt).toEqual(expect.any(Number));
    expect(state.buyOffers[0]?.creatorUsername).toBe("buyer123");
    expect(state.buyOffers[0]?.createdAt).toBe("2026-10-05T15:50:00.000Z");
    expect(state.buyOffers[0]?.fiatAmount).toBe("10000");
    expect(state.buyOffers[0]?.onlyVip).toBe(true);
    expect(state.buyOffers[0]?.creatorVip).toBe(true);
    expect(state.sellOffers[0]?.creatorUsername).toBe("seller-best");
    expect(state.sellOffers[0]?.createdAt).toBe("2026-10-05T15:50:20.000Z");
    expect(state.sellOffers[0]?.fiatAmount).toBe("15015");
  });

  it("marks an empty persisted market explicitly", () => {
    const state = toPublicScannerState({
      ...marketState,
      market: { coin: "BANK_CUP", offers: [] },
    });

    expect(state.snapshotStatus).toBe("EMPTY");
    expect(state.metrics.totalOffers).toBe(0);
    expect(state.buyOffers).toEqual([]);
    expect(state.sellOffers).toEqual([]);
  });

  it("marca el estado previo al escaneo como no disponible", () => {
    const state = toPublicScannerState({
      ...marketState,
      market: null,
    });

    expect(state.snapshotStatus).toBe("UNAVAILABLE");
    expect(state.metrics.snapshotAt).toBeNull();
  });

  it("returns a sanitized public JSON contract", async () => {
    const response = createPublicScannerStateResponse(
      toPublicScannerState(marketState),
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).not.toContain("SCANNER_BOOTSTRAP_TOKEN");
    expect(body).not.toContain("app-secret");
    expect(body).toContain('"bestBuyRate":"1000"');
    expect(body).toContain('"createdAt"');
    expect(body).toContain('"creatorUsername"');
  });

  it(
    "renderiza solo el contenido asignado a cada ruta modular en el servidor",
    async () => {
      const cases = [
        {
          module: "inicio",
          required: ['id="overview"'],
          forbidden: [
            'id="cuenta"',
            'id="mercado"',
            'id="operaciones"',
            'id="administracion"',
            'id="auditoria"',
            'id="controles"',
          ],
        },
        {
          module: "cuenta",
          required: ['id="cuenta"', 'id="seguridad-cuenta"'],
          forbidden: [
            'id="mercado"',
            'id="operaciones"',
            'id="administracion"',
            'id="auditoria"',
          ],
        },
        {
          module: "mercado",
          required: ['id="overview"', 'id="mercado"'],
          forbidden: [
            'id="cuenta"',
            'id="operaciones"',
            'id="administracion"',
            'id="auditoria"',
          ],
        },
        {
          module: "arbitraje",
          required: [
            'id="module-placeholder"',
            "Implementación funcional pendiente",
            "<h2>Arbitraje</h2>",
          ],
          forbidden: [
            'id="overview"',
            'id="cuenta"',
            'id="mercado"',
            'id="operaciones"',
            'id="administracion"',
          ],
        },
        {
          module: "operaciones",
          required: ['id="operaciones"'],
          forbidden: [
            'id="cuenta"',
            'id="mercado"',
            'id="administracion"',
            'id="auditoria"',
          ],
        },
        {
          module: "usuarios",
          required: ['id="administracion"'],
          forbidden: [
            'id="cuenta"',
            'id="mercado"',
            'id="operaciones"',
            'id="auditoria"',
          ],
        },
        {
          module: "seguridad",
          required: ['id="controles"', 'id="auditoria"'],
          forbidden: [
            'id="cuenta"',
            'id="mercado"',
            'id="operaciones"',
            'id="administracion"',
          ],
        },
        {
          module: "monitor",
          required: [
            'id="monitor-module"',
            'id="health"',
            'id="countdown"',
            'id="eventCompleted"',
            "<h2 id=\"monitor-title\">Monitor y observabilidad</h2>",
          ],
          forbidden: [
            'id="overview"',
            'id="module-placeholder"',
            'id="cuenta"',
            'id="mercado"',
            'id="operaciones"',
            'id="administracion"',
          ],
        },
        {
          module: "configuracion",
          required: [
            'id="module-placeholder"',
            "Implementación funcional pendiente",
            "<h2>Configuración</h2>",
          ],
          forbidden: [
            'id="overview"',
            'id="cuenta"',
            'id="mercado"',
            'id="operaciones"',
            'id="administracion"',
          ],
        },
      ] as const;

      for (const testCase of cases) {
        const response = createPublicAppResponse(testCase.module);
        const body = await response.text();

        expect(body).toContain(`<body data-module="${testCase.module}">`);

        for (const marker of testCase.required) {
          expect(body, `${testCase.module} must render ${marker}`).toContain(
            marker,
          );
        }

        for (const marker of testCase.forbidden) {
          expect(
            body,
            `${testCase.module} must not render ${marker}`,
          ).not.toContain(marker);
        }
      }
    },
  );
});
