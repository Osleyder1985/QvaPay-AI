import { describe, expect, it } from "vitest";
import type { Market } from "../../src/domain/market.js";
import {
  executeScannerAlarm,
  SCANNER_MARKET_SNAPSHOT_KEY,
  SCANNER_EXECUTION_STATE_KEY,
  type ScannerSchedulerPersistentStorage,
} from "../../src/infrastructure/cloudflare/scanner-scheduler-do-logic.js";

class MemoryStorage implements ScannerSchedulerPersistentStorage {
  private readonly values = new Map<string, unknown>();
  private alarm: number | null = null;

  async get<T>(key: string): Promise<T | undefined> {
    return this.values.get(key) as T | undefined;
  }

  async put<T>(key: string, value: T): Promise<void> {
    this.values.set(key, value);
  }

  async getAlarm(): Promise<number | null> {
    return this.alarm;
  }

  setAlarm(value: number): void {
    this.alarm = value;
  }
}

describe("scanner market snapshot persistence", () => {
  it("persists the market returned by the server-side scan", async () => {
    const storage = new MemoryStorage();
    const market: Market = {
      coin: "QUSD",
      offers: [
        {
          id: "buy-1",
          market: "QUSD",
          side: "BUY",
          rate: "1000",
          amount: "5",
          availableAmount: "5",
          status: "open",
          sourceTimestamp: "2026-10-05T16:00:00.000Z",
          observedAt: "2026-10-05T16:00:00.000Z",
        },
      ],
    };

    const provider = {
      fetchOffers: async () => market.offers,
    };

    await executeScannerAlarm(
      storage,
      { coin: "QUSD", intervalSeconds: 10 },
      provider,
      Date.parse("2026-10-05T16:00:00.000Z"),
    );

    await expect(
      storage.get<Market>(SCANNER_MARKET_SNAPSHOT_KEY),
    ).resolves.toEqual(market);
    await expect(
      storage.get(SCANNER_EXECUTION_STATE_KEY),
    ).resolves.toMatchObject({
      lastOfferCount: 1,
      lastBuyCount: 1,
      lastSellCount: 0,
      lastError: null,
    });
  });
});
