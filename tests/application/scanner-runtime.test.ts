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
  it("ejecuta un escaneo y programa la siguiente ejecución después de completarlo", async () => {
    const { provider, scheduler } = createHarness();
    const startedAt = new Date("2026-10-04T18:00:00.000Z");
    const completedAt = new Date("2026-10-04T18:02:30.000Z");
    const clock = vi
      .fn<() => Date>()
      .mockReturnValueOnce(startedAt)
      .mockReturnValueOnce(completedAt);
    const runtime = new ScannerRuntime(
      provider,
      {
        coin: "QUSD",
        intervalSeconds: 10,
        scheduler,
      },
      clock,
    );

    const result = await runtime.run();

    expect(result).toEqual(market);
    expect(scheduler.scheduleNext).toHaveBeenCalledWith(
      new Date("2026-10-04T18:02:40.000Z"),
    );
    expect(runtime.getState()).toMatchObject({
      status: "idle",
      lastStartedAt: startedAt.toISOString(),
      lastCompletedAt: completedAt.toISOString(),
      nextRunAt: "2026-10-04T18:02:40.000Z",
    });
  });

  it("rechaza un intervalo inválido", () => {
    const { provider, scheduler } = createHarness();

    expect(
      () =>
        new ScannerRuntime(provider, {
          coin: "QUSD",
          intervalSeconds: 4,
          scheduler,
        }),
    ).toThrow("between 5 and 300");
  });

  it("rechaza una moneda vacía", () => {
    const { provider, scheduler } = createHarness();

    expect(
      () =>
        new ScannerRuntime(provider, {
          coin: " ",
          intervalSeconds: 10,
          scheduler,
        }),
    ).toThrow("no puede estar vacío");
  });

  it("impide ejecuciones superpuestas", async () => {
    const { provider, scheduler } = createHarness();
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.mocked(provider.fetchOffers).mockReturnValueOnce(blocked.then(() => []));

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

  it("registra los fallos sin programar otra ejecución", async () => {
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
  it("acepta los límites configurados", () => {
    expect(() => validateInterval(5)).not.toThrow();
    expect(() => validateInterval(300)).not.toThrow();
  });

  it("rechaza valores no enteros y valores fuera de rango", () => {
    expect(() => validateInterval(10.5)).toThrow();
    expect(() => validateInterval(301)).toThrow();
  });
});
