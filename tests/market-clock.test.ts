import { describe, expect, it } from "vitest";
import { DASHBOARD_CLIENT_SCRIPT } from "../src/presentation/dashboard/dashboard-client.js";
import {
  estimateServerNow,
  snapshotAgeMs,
} from "../src/presentation/dashboard/market-clock.js";

describe("reloj del servidor para frescura del mercado", () => {
  it("estima el tiempo del servidor aunque el reloj local esté adelantado", () => {
    expect(estimateServerNow(1_000_000, 9_000_000, 9_005_000)).toBe(1_005_000);
  });

  it("estima el tiempo del servidor aunque el reloj local esté atrasado", () => {
    expect(estimateServerNow(1_000_000, -9_000_000, -8_995_000)).toBe(1_005_000);
  });

  it("calcula la antigüedad con el reloj del servidor y el tiempo transcurrido desde la recepción", () => {
    expect(
      snapshotAgeMs(
        "1970-01-01T00:16:39.000Z",
        1_000_000,
        9_000_000,
        9_005_000,
      ),
    ).toBe(6_000);
  });

  it("no devuelve antigüedad negativa para una marca futura", () => {
    expect(
      snapshotAgeMs(
        "1970-01-01T00:16:50.000Z",
        1_000_000,
        9_000_000,
        9_005_000,
      ),
    ).toBe(0);
  });

  it("clasifica marcas ausentes, inválidas o relojes inconsistentes como no verificables", () => {
    expect(snapshotAgeMs(null, 1_000, 2_000, 2_100)).toBe(Infinity);
    expect(snapshotAgeMs("fecha-invalida", 1_000, 2_000, 2_100)).toBe(Infinity);
    expect(estimateServerNow(1_000, 2_000, 1_999)).toBeNaN();
  });
});

describe("integración del reloj y sondeo del mercado", () => {
  it("usa el reloj estimado del servidor para edad y cuenta regresiva", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("snapshotAgeMs(state.metrics?.snapshotAt,state.serverNowAt,state.__receivedAt,Date.now())");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("estimateServerNow(state.serverNowAt,state.__receivedAt,Date.now())");
  });

  it("limita el sondeo a cinco segundos y evita solicitudes concurrentes", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("setInterval(refresh,5000)");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("if(refreshInFlight)return");
  });

  it("conserva y marca como desconectado el último snapshot si falla la actualización", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("state={...state,__offline:true};render()");
  });
});
