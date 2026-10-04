import { env } from "cloudflare:workers";
import {
  reset,
  runDurableObjectAlarm,
  runInDurableObject,
} from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CloudflareScannerScheduler } from "../../src/infrastructure/cloudflare/scanner-scheduler.js";
import {
  createScannerSchedulerState,
  normalizeScannerSchedulerConfig,
  type ScannerSchedulerConfig,
} from "../../src/infrastructure/cloudflare/scanner-scheduler-config.js";

function createStorage() {
  return {
    setAlarm: vi.fn().mockResolvedValue(undefined),
  };
}

afterEach(async () => {
  vi.unstubAllGlobals();
  await reset();
});

describe("CloudflareScannerScheduler", () => {
  it("schedules an alarm using the requested instant", async () => {
    const storage = createStorage();
    const scheduler = new CloudflareScannerScheduler(storage);

    const runAt = new Date("2026-10-04T19:00:10.000Z");
    await scheduler.scheduleNext(runAt);

    expect(storage.setAlarm).toHaveBeenCalledWith(runAt.getTime());
  });

  it("keeps an existing alarm when configuration is unchanged", async () => {
    const stub = env.SCANNER_SCHEDULER.getByName("unchanged-config");
    await stub.ensureScheduled({ coin: "QUSD", intervalSeconds: 5 });

    const firstAlarm = await runInDurableObject(stub, async (_, state) =>
      state.storage.getAlarm(),
    );

    await stub.ensureScheduled({ coin: "QUSD", intervalSeconds: 5 });

    const secondAlarm = await runInDurableObject(stub, async (_, state) =>
      state.storage.getAlarm(),
    );

    expect(firstAlarm).not.toBeNull();
    expect(secondAlarm).toBe(firstAlarm);
  });

  it("executes an Alarm and schedules a bounded retry after provider failure", async () => {
    const stub = env.SCANNER_SCHEDULER.getByName("failure-retry");
    await stub.ensureScheduled({ coin: "QUSD", intervalSeconds: 5 });

    const initialAlarm = await runInDurableObject(stub, async (_, state) =>
      state.storage.getAlarm(),
    );

    const fetcher = vi.fn().mockRejectedValue(new Error("provider unavailable"));
    vi.stubGlobal("fetch", fetcher);

    expect(await runDurableObjectAlarm(stub)).toBe(true);

    const retryAlarm = await runInDurableObject(stub, async (_, state) =>
      state.storage.getAlarm(),
    );

    expect(initialAlarm).not.toBeNull();
    expect(retryAlarm).not.toBeNull();
    expect(retryAlarm).toBeGreaterThan(initialAlarm ?? 0);
    expect(fetcher).toHaveBeenCalled();
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
