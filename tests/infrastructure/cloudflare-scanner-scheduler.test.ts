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
  it("programa un Alarm usando el instante solicitado", async () => {
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

  it("crea el Alarm inicial usando el intervalo configurado", async () => {
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

  it("mantiene un Alarm existente cuando la configuración no cambia", async () => {
    const { storage, getAlarm } = createStorage(18_000);

    await storage.put("scanner-config", {
      coin: "QUSD",
      intervalSeconds: 5,
    });

    const state = await ensureScannerScheduled(
      storage,
      { coin: "QUSD", intervalSeconds: 5 },
      10_000,
    );

    expect(state.nextAlarmAt).toBe(18_000);
    expect(getAlarm()).toBe(18_000);
  });

  it("reprograma el Alarm cuando cambia la configuración", async () => {
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

  it("reprograma el siguiente Alarm después de un escaneo exitoso", async () => {
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

  it("reprograma un único reintento acotado después de un fallo del proveedor", async () => {
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
  it("recorta la moneda y conserva un intervalo válido", () => {
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

  it("rechaza una moneda vacía", () => {
    expect(() =>
      normalizeScannerSchedulerConfig({
        coin: " ",
        intervalSeconds: 10,
      }),
    ).toThrow("no puede estar vacío");
  });

  it("rechaza intervalos fuera de los límites del runtime", () => {
    expect(() =>
      normalizeScannerSchedulerConfig({
        coin: "QUSD",
        intervalSeconds: 4,
      }),
    ).toThrow("entre 5 y 300");

    expect(() =>
      normalizeScannerSchedulerConfig({
        coin: "QUSD",
        intervalSeconds: 301,
      }),
    ).toThrow("entre 5 y 300");
  });
});

describe("createScannerSchedulerState", () => {
  it("representa un scheduler sin configurar", () => {
    expect(createScannerSchedulerState(undefined, null)).toEqual({
      configured: false,
      coin: null,
      intervalSeconds: null,
      nextAlarmAt: null,
    });
  });

  it("representa la configuración persistida y el estado del Alarm", () => {
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
