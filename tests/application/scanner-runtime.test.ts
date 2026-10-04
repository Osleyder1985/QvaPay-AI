import { describe, expect, it, vi } from "vitest";
import {
  ScannerRuntime,
  validateInterval,
} from "../../src/application/scanner-runtime.js";
import type { MarketProvider } from "../../src/application/ports/market-provider.js";
import type { ScannerScheduler } from "../../src/application/ports/scanner-scheduler.js";

const market = {
  coin: "QUSD",
  offers: [],
} as const;

function createHarness() {
  const provider: MarketProvider = {
    fetchOffers: vi.fn().mockResolvedValue([]),
  };
  const scheduler: ScannerScheduler = {
    scheduleNext: vi.fn().mockResolvedValue(undefined),
  };
  return { provider, scheduler };
}

describe("ScannerRuntime", () => {
  it("runs a scan and schedules the next execution", async () => {
    const { provider, scheduler } = createHarness();
    const now = new Date("2026-10-04T18:00:00.000Z");
    const runtime = new ScannerRuntime(provider, {
      coin: "QUSD",
      intervalSeconds: 10,
      scheduler,
    });

    const result = await runtime.run();

    expect(result).toEqual(market);
    expect(scheduler.scheduleNext).toHaveBeenCalledWith(
      new Date("2026-10-04T18:00:10.000Z"),
    );
    expect(runtime.getState()).toMatchObject({
      status: "idle",
      lastStartedAt: now.toISOString(),
      nextRunAt: "2026-10-04T18:00:10.000Z",
    });
  });

  it("rejects an invalid interval", () => {
    const { provider, scheduler } = createHarness();

    expect(() => new ScannerRuntime(provider, {
      coin: "QUSD",
      intervalSeconds: 4,
      scheduler,
    })).toThrow("between 5 and 300");
  });

  it("rejects an empty coin", () => {
    const { provider, scheduler } = createHarness();

    expect(() => new ScannerRuntime(provider, {
      coin: " ",
      intervalSeconds: 10,
      scheduler,
    })).toThrow("must not be empty");
  });

  it("prevents overlapping executions", async () => {
    const { provider, scheduler } = createHarness();
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.mocked(provider.fetchOffers).mockReturnValueOnce(
      blocked.then(() => []),
    );

    const runtime = new ScannerRuntime(provider, {
      coin: "QUSD",
      intervalSeconds: 10,
      scheduler,
    });

    const firstRun = runtime.run();
    const secondRun = await runtime.run();

    expect(secondRun).toBeNull();
    release();
    await firstRun;
    expect(provider.fetchOffers).toHaveBeenCalledTimes(1);
  });

  it("records failures without scheduling another run", async () => {
    const { provider, scheduler } = createHarness();
    vi.mocked(provider.fetchOffers).mockRejectedValueOnce(
      new Error("provider unavailable"),
    );

    const runtime = new ScannerRuntime(provider, {
      coin: "QUSD",
      intervalSeconds: 10,
      scheduler,
    });

    await expect(runtime.run()).rejects.toThrow("provider unavailable");
    expect(runtime.getState()).toMatchObject({
      status: "failed",
      lastError: "provider unavailable",
    });
    expect(scheduler.scheduleNext).not.toHaveBeenCalled();
  });
});

describe("validateInterval", () => {
  it("accepts the configured bounds", () => {
    expect(() => validateInterval(5)).not.toThrow();
    expect(() => validateInterval(300)).not.toThrow();
  });

  it("rejects non-integers and out-of-range values", () => {
    expect(() => validateInterval(10.5)).toThrow();
    expect(() => validateInterval(301)).toThrow();
  });
});
