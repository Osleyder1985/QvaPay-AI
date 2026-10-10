/**
 * @archivo tests/dashboard-refresh.test.ts
 * @proposito Verificar el contrato de sincronización adaptativa del Dashboard.
 * @responsabilidades Evitar la regresión del sondeo HTTP continuo y exigir recuperación visible con backoff acotado.
 * @ubicacion tests de presentación para el cliente del Dashboard.
 */
import { describe, expect, it } from "vitest";

import { DASHBOARD_CLIENT_SCRIPT } from "../src/presentation/dashboard/dashboard-client.js";

describe("sincronización adaptativa del Dashboard", () => {
  it("mantiene el contador local separado del sondeo HTTP", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("setInterval(tick,1000)");
    expect(DASHBOARD_CLIENT_SCRIPT).not.toMatch(/setInterval\(refresh\s*,/);
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("scheduleRefresh()");
  });

  it("suspende la programación en segundo plano y reconcilia al volver visible", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      'document.visibilityState!=="visible"',
    );
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      'document.addEventListener("visibilitychange"',
    );
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      'if(document.visibilityState==="visible")scheduleRefresh(0)',
    );
  });

  it("reintenta inmediatamente al recuperar conectividad", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      'window.addEventListener("online",()=>scheduleRefresh(0))',
    );
  });

  it("aplica backoff exponencial acotado y lo reinicia tras una respuesta válida", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      "Math.min(60000,Math.max(5000,refreshDelay*2))",
    );
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      "refreshDelay=5000;succeeded=true",
    );
  });
});
