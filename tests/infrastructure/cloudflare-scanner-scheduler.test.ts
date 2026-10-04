import { describe, expect, it, vi } from "vitest";
import { CloudflareScannerScheduler } from "../../src/infrastructure/cloudflare/scanner-scheduler.js";
import {
  createScannerSchedulerState,
  normalizeScannerSchedulerConfig,
  type ScannerSchedulerConfig,
} from "../../src/infrastructure/cloudflare/scanner-scheduler-do.js";

function createStorage() {
  return {
    setAlarm: vi.fn().mockResolvedValue(undefined),
  };
}

describe("CloudflareScannerScheduler", () => {
  it("schedules an alarm using the requested instant", async () => {
    const storage = createStorage();
    const scheduler = new CloudflareScannerScheduler(storage);

    const runAt = new Date("2026-10-04T19:00:10.000Z");
    await scheduler.scheduleNext(runAt);

    expect(storage.setAlarm).toHaveBeenCalledWith(runAt.getTime());
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

  it("rejects an interval outside the runtime bounds", () => {
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
