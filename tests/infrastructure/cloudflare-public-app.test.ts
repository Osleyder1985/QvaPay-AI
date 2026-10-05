import { describe, expect, it } from "vitest";
import {
  createPublicAppResponse,
  createPublicScannerStateResponse,
  toPublicScannerState,
} from "../../src/infrastructure/cloudflare/public-app.js";
import type { ScannerSchedulerRuntimeState } from "../../src/infrastructure/cloudflare/scanner-scheduler-do.js";

const marketState: ScannerSchedulerRuntimeState = {
  configured: true,
  coin: "QUSD",
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
    coin: "QUSD",
    offers: [
      {
        id: "buy-low",
        market: "QUSD",
        side: "BUY",
        rate: "999",
        amount: "10",
        availableAmount: "5",
        sourceTimestamp: "2026-10-05T15:59:00.000Z",
        observedAt: "2026-10-05T16:00:01.000Z",
      },
      {
        id: "buy-best",
        market: "QUSD",
        side: "BUY",
        rate: "1000",
        amount: "20",
        availableAmount: "7",
        sourceTimestamp: "2026-10-05T15:59:30.000Z",
        observedAt: "2026-10-05T16:00:01.000Z",
      },
      {
        id: "sell-best",
        market: "QUSD",
        side: "SELL",
        rate: "1001",
        amount: "15",
        availableAmount: "8",
        sourceTimestamp: "2026-10-05T15:59:20.000Z",
        observedAt: "2026-10-05T16:00:01.000Z",
      },
      {
        id: "sell-high",
        market: "QUSD",
        side: "SELL",
        rate: "1002",
        amount: "30",
        availableAmount: "9",
        sourceTimestamp: "2026-10-05T15:59:10.000Z",
        observedAt: "2026-10-05T16:00:01.000Z",
      },
    ],
  },
};

describe("public production dashboard", () => {
  it("serves the application without credentials", async () => {
    const response = createPublicAppResponse();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("content-security-policy")).toContain(
      "connect-src 'self'",
    );
    expect(body).toContain("QvaPay-AI");
    expect(body).toContain("BEST BUY");
    expect(body).toContain("BEST SELL");
    expect(body).toContain("10");
    expect(body).not.toContain("QVAPAY_APP_SECRET");
    expect(body).not.toContain("SCANNER_BOOTSTRAP_TOKEN");
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
  });

  it("marks an empty persisted market explicitly", () => {
    const state = toPublicScannerState({
      ...marketState,
      market: { coin: "QUSD", offers: [] },
    });

    expect(state.snapshotStatus).toBe("EMPTY");
    expect(state.metrics.totalOffers).toBe(0);
    expect(state.buyOffers).toEqual([]);
    expect(state.sellOffers).toEqual([]);
  });

  it("marks the pre-scan state as unavailable", () => {
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
  });
});
