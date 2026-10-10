import { describe, expect, it, vi } from "vitest";
import { DASHBOARD_CLIENT_SCRIPT } from "../src/presentation/dashboard/dashboard-client.js";
import {
  estimateServerNow,
  snapshotAgeMs,
} from "../src/presentation/dashboard/market-clock.js";

describe("reloj del servidor", () => {
  it("estima un reloj local adelantado", () => {
    expect(estimateServerNow(1_000_000, 9_000_000, 9_005_000)).toBe(1_005_000);
  });

  it("estima un reloj local atrasado", () => {
    expect(estimateServerNow(1_000_000, -9_000_000, -8_995_000)).toBe(
      1_005_000,
    );
  });

  it("calcula la antigüedad del snapshot", () => {
    expect(
      snapshotAgeMs(
        "1970-01-01T00:16:39.000Z",
        1_000_000,
        9_000_000,
        9_005_000,
      ),
    ).toBe(6_000);
  });

  it("no asigna edad negativa a una marca futura", () => {
    expect(
      snapshotAgeMs(
        "1970-01-01T00:16:50.000Z",
        1_000_000,
        9_000_000,
        9_005_000,
      ),
    ).toBe(0);
  });

  it("rechaza fechas y relojes inválidos", () => {
    expect(snapshotAgeMs(null, 1_000, 2_000, 2_100)).toBe(Infinity);
    expect(snapshotAgeMs("fecha-invalida", 1_000, 2_000, 2_100)).toBe(Infinity);
    expect(estimateServerNow(1_000, 2_000, 1_999)).toBeNaN();
  });
});

/**
 * Ejecuta la función refresh real del script de navegador con dependencias
 * aisladas para verificar concurrencia y recuperación ante fallos de red.
 */
function createRefreshHarness(fetchImplementation: typeof fetch) {
  const marker = "let refreshInFlight=false;async function refresh(){";
  const start = DASHBOARD_CLIENT_SCRIPT.indexOf(marker);
  const end = DASHBOARD_CLIENT_SCRIPT.indexOf("\nfunction tick(){", start);

  if (start < 0 || end < 0) {
    throw new Error("No se pudo localizar la función refresh del dashboard.");
  }

  const refreshSource = DASHBOARD_CLIENT_SCRIPT.slice(start, end);
  const factory = new Function(
    "fetch",
    "readJsonObject",
    "isScannerState",
    "render",
    "$",
    "performance",
    `${refreshSource}; return { refresh, getState: () => state };`,
  ) as (
    fetchImplementation: typeof globalThis.fetch,
    readJsonObject: (response: Response) => Promise<unknown>,
    isScannerState: (value: unknown) => boolean,
    render: () => void,
    selector: (id: string) => { className: string; textContent: string },
    performance: { now: () => number },
  ) => {
    refresh: () => Promise<void>;
    getState: () => Record<string, unknown> | null;
  };

  return factory(
    fetchImplementation,
    async (response) => response.json(),
    (value) =>
      !!value &&
      typeof value === "object" &&
      typeof (value as { snapshotStatus?: unknown }).snapshotStatus ===
        "string" &&
      typeof (value as { metrics?: unknown }).metrics === "object" &&
      Array.isArray((value as { buyOffers?: unknown }).buyOffers) &&
      Array.isArray((value as { sellOffers?: unknown }).sellOffers),
    () => undefined,
    () => ({ className: "", textContent: "" }),
    { now: () => 100 },
  );
}

const scannerSnapshot = {
  snapshotStatus: "READY",
  serverNowAt: 1_000,
  intervalSeconds: 10,
  configured: true,
  running: false,
  nextAlarmAt: null,
  lastError: null,
  metrics: { snapshotAt: "1970-01-01T00:00:01.000Z" },
  buyOffers: [],
  sellOffers: [],
};

describe("integración ejecutable del sondeo", () => {
  it("no inicia una segunda solicitud mientras la primera sigue pendiente", async () => {
    let finishRequest: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finishRequest = resolve;
        }),
    );
    const harness = createRefreshHarness(fetchMock);

    const firstRequest = harness.refresh();
    await harness.refresh();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    finishRequest?.({
      ok: true,
      json: async () => scannerSnapshot,
    } as Response);
    await firstRequest;

    expect(harness.getState()).toMatchObject({ __offline: false });
  });

  it("conserva el snapshot y lo marca offline si falla la siguiente solicitud", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => scannerSnapshot,
      } as Response)
      .mockRejectedValueOnce(new Error("network unavailable"));
    const harness = createRefreshHarness(fetchMock);

    await harness.refresh();
    const previousState = harness.getState();
    expect(previousState).toMatchObject({
      snapshotStatus: "READY",
      __offline: false,
    });

    await harness.refresh();

    expect(harness.getState()).toMatchObject({
      snapshotStatus: "READY",
      __offline: true,
    });
    expect(harness.getState()?.metrics).toEqual(previousState?.metrics);
  });
});

describe("contrato de temporización del dashboard", () => {
  it("usa el reloj del servidor para edad y cuenta regresiva", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("snapshotAgeMs(");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      "state.metrics?.snapshotAt,state.serverNowAt",
    );
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("performance.now()");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("estimateServerNow(");
  });

  it("programa el sondeo cada cinco segundos y evita solapamientos", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("setInterval(refresh,5000)");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("if(refreshInFlight)return");
  });
});
