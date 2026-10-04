import { describe, expect, it, vi } from "vitest";
import { CloudflareScannerScheduler } from "../../src/infrastructure/cloudflare/scanner-scheduler.js";
import {
  createScannerSchedulerState,
  type ScannerSchedulerConfig,
} from "../../src/infrastructure/cloudflare/scanner-scheduler-do.js";

function createStorage() {
  return {
    setAlarm: vi.fn().mockResolvedValue(undefined),
    getAlarm: vi.fn().mockResolvedValue(null),
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
