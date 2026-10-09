import { describe, expect, it } from "vitest";
import {
  DASHBOARD_CLIENT_SCRIPT,
} from "../src/presentation/dashboard/dashboard-client.js";
import {
  estimateServerNow,
  snapshotAgeMs,
} from "../src/presentation/dashboard/market-clock.js";

describe("reloj del servidor", () => {
  it("estima un reloj local adelantado", () => {
    expect(estimateServerNow(1_000_000, 9_000_000, 9_005_000)).toBe(
      1_005_000,
    );
  });

  it("estima un reloj local atrasado", () => {
    expect(estimateServerNow(1_000_000, -9_000_000, -8_995_000)).toBe(
      1_005_000,
    );
  });

  it("calcula la antigüedad del snapshot", () => {
    expect(
      snapshotAgeMs("1970-01-01T00:16:39.000Z", 1_000_000, 9_000_000, 9_005_000),
    ).toBe(6_000);
  });

  it("no asigna edad negativa a una marca futura", () => {
    expect(
      snapshotAgeMs("1970-01-01T00:16:50.000Z", 1_000_000, 9_000_000, 9_005_000),
    ).toBe(0);
  });

  it("rechaza fechas y relojes inválidos", () => {
    expect(snapshotAgeMs(null, 1_000, 2_000, 2_100)).toBe(Infinity);
    expect(snapshotAgeMs("fecha-invalida", 1_000, 2_000, 2_100)).toBe(
      Infinity,
    );
    expect(estimateServerNow(1_000, 2_000, 1_999)).toBeNaN();
  });
});

describe("integración del reloj y sondeo", () => {
  it("usa el reloj del servidor para edad y cuenta regresiva", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("snapshotAgeMs(");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      "state.metrics?.snapshotAt,state.serverNowAt",
    );
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("performance.now()");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("estimateServerNow(");
  });

  it("limita el sondeo y evita solicitudes concurrentes", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("setInterval(refresh,5000)");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("if(refreshInFlight)return");
  });

  it("conserva el snapshot si falla la actualización", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      "state={...state,__offline:true};render()",
    );
  });
});
