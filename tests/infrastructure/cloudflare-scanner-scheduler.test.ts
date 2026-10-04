import { describe, expect, it } from "vitest";
import { CloudflareScannerScheduler } from "../../src/infrastructure/cloudflare/scanner-scheduler.js";
import {
  ensureScannerScheduled,
  executeScannerAlarm,
  type ScannerSchedulerPersistentStorage,
} from "../../src/infrastructure/cloudflare/scanner-scheduler-do-logic.js";
import {
  createScannerSchedulerState,
  normalizeScannerSchedulerConfig,
  type ScannerSchedulerConfig,
} from "../../src/infrastructure/cloudflare/scanner-scheduler-config.js";

function createStorage(initialAlarm: number | null = null) {
  const values = new Map<string, unknown>();
  let alarm = initialAlarm;

  const storage: ScannerSchedulerPersistentStorage = {
    async get<T>(key: string) {
      return values.get(key) as T | undefined;
    },
    async put<T>(key: string, value: T) {
      values.set(key, value);
    },
    async getAlarm() {
      return alarm;
    },
    setAlarm(scheduledTimeMs) {
      alarm = scheduledTimeMs;
    },
  };

  return {
    storage,
    getAlarm: () => alarm,
  };
}

describe("CloudflareScannerScheduler", () => {
  it("schedules an alarm using the requested instant", async () => {
    let scheduledAt: number | undefined;
    const scheduler = new CloudflareScannerScheduler({
      setAlarm(value) {
        scheduledAt = value;
      },
    });

    const runAt = new Date("2026-10-04T19:00:10.000Z");
    await scheduler.scheduleNext(runAt);

    expect(scheduledAt).toBe(runAt.getTime());
  });

  it("creates the initial alarm using the configured interval", async () => {
    const { storage, getAlarm } = createStorage();
    const state = await ensureScannerScheduled(
      storage,
      { coin: "QUSD", intervalSeconds: 5 },
      1_000,
    );

    expect(state).toEqual({
      configured: true,
      coin: "QUSD",
      intervalSeconds: 5,
      nextAlarmAt: 6_000,
    });
    expect(getAlarm()).toBe(6_000);
  });

  it("keeps an existing alarm when configuration is unchanged", async () => {
    const { storage, getAlarm } = createStorage(8_000);

    await storage.put("scanner-config", {
      coin: "QUSD",
      intervalSeconds: 5,
    });

    const state = await ensureScannerScheduled(
      storage,
      { coin: "QUSD", intervalSeconds: 5 },
      10_000,
    );

    expect(state.nextAlarmAt).toBe(8_000);
    expect(getAlarm()).toBe(8_000);
  });

  it("reprograms the alarm when configuration changes", async () => {
    const { storage, getAlarm } = createStorage(8_000);

    await storage.put("scanner-config", {
      coin: "QUSD",
      intervalSeconds: 5,
    });

    const state = await ensureScannerScheduled(
      storage,
      { coin: "QUSD", intervalSeconds: 10 },
      10_000,
    );

    expect(state.nextAlarmAt).toBe(20_000);
    expect(getAlarm()).toBe(20_000);
  });

  it("reschedules the next alarm after a successful scan", async () => {
    const { storage, getAlarm } = createStorage();
    const provider = {
      fetchOffers: async () => [],
    };

    await executeScannerAlarm(
      storage,
      { coin: "QUSD", intervalSeconds: 5 },
      provider,
    );

    expect(getAlarm()).not.toBeNull();
    expect(getAlarm()).toBeGreaterThan(Date.now());
  });

  it("reschedules a single bounded retry after a provider failure", async () => {
    const { storage, getAlarm } = createStorage();
    const provider = {
      fetchOffers: async () => {
        throw new Error("provider unavailable");
      },
    };

    await executeScannerAlarm(
      storage,
      { coin: "QUSD", intervalSeconds: 5 },
      provider,
    );

    expect(getAlarm()).not.toBeNull();
    expect(getAlarm()).toBeGreaterThan(Date.now());
  });
});

describe("normalizeScannerSchedulerConfig", () => {
  it("trims the coin and preserves a valid interval", () => {
    expect(
      normalizeScannerSchedulerConfig({
        coin: " QUSD ",
        intervalSeconds: 10,
      }),
    ).toEqual({
      coin: "QUSD",
      intervalSeconds: 10,
    });
  });

  it("rejects an empty coin", () => {
    expect(() =>
      normalizeScannerSchedulerConfig({
        coin: " ",
        intervalSeconds: 10,
      }),
    ).toThrow("must not be empty");
  });

  it("rejects intervals outside the runtime bounds", () => {
    expect(() =>
      normalizeScannerSchedulerConfig({
        coin: "QUSD",
        intervalSeconds: 4,
      }),
    ).toThrow("between 5 and 300");

    expect(() =>
      normalizeScannerSchedulerConfig({
        coin: "QUSD",
        intervalSeconds: 301,
      }),
    ).toThrow("between 5 and 300");
  });
});

describe("createScannerSchedulerState", () => {
  it("represents an unconfigured scheduler", () => {
    expect(createScannerSchedulerState(undefined, null)).toEqual({
      configured: false,
      coin: null,
      intervalSeconds: null,
      nextAlarmAt: null,
    });
  });

  it("represents persisted configuration and alarm state", () => {
    const config: ScannerSchedulerConfig = {
      coin: "QUSD",
      intervalSeconds: 10,
    };

    expect(createScannerSchedulerState(config, 1_000)).toEqual({
      configured: true,
      coin: "QUSD",
      intervalSeconds: 10,
      nextAlarmAt: 1_000,
    });
  });
});
