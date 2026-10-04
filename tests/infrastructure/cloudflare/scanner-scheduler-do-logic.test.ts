import { describe, expect, it } from "vitest";
import {
  executeScannerAlarm,
  SCANNER_EXECUTION_STATE_KEY,
  type ScannerRuntimeExecutionState,
  type ScannerSchedulerPersistentStorage,
} from "../../../src/infrastructure/cloudflare/scanner-scheduler-do-logic.js";
import type { MarketProvider } from "../../../src/application/ports/market-provider.js";

class FakeStorage implements ScannerSchedulerPersistentStorage {
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

  async setAlarm(scheduledTimeMs: number): Promise<void> {
    this.alarm = scheduledTimeMs;
  }
}

const config = {
  coin: "QUSD",
  intervalSeconds: 10,
};

describe("executeScannerAlarm", () => {
  it("persists started and completed execution timestamps", async () => {
    const storage = new FakeStorage();
    const provider: MarketProvider = {
      fetchOffers: async () => [],
    };

    await executeScannerAlarm(
      storage,
      config,
      provider,
      Date.parse("2026-10-04T12:00:00.000Z"),
    );

    const state =
      await storage.get<ScannerRuntimeExecutionState>(
        SCANNER_EXECUTION_STATE_KEY,
      );

    expect(state).toMatchObject({
      lastStartedAt: "2026-10-04T12:00:00.000Z",
      lastError: null,
    });
    expect(state?.lastCompletedAt).toEqual(expect.any(String));
  });

  it("persists the error and schedules the next cycle after failure", async () => {
    const storage = new FakeStorage();
    const provider: MarketProvider = {
      fetchOffers: async () => {
        throw new Error("QvaPay unavailable");
      },
    };

    await executeScannerAlarm(
      storage,
      config,
      provider,
      Date.parse("2026-10-04T12:00:00.000Z"),
    );

    const state =
      await storage.get<ScannerRuntimeExecutionState>(
        SCANNER_EXECUTION_STATE_KEY,
      );

    expect(state).toMatchObject({
      lastStartedAt: "2026-10-04T12:00:00.000Z",
      lastCompletedAt: null,
      lastError: "QvaPay unavailable",
    });
    expect(await storage.getAlarm()).toBeGreaterThan(Date.now());
  });
});
