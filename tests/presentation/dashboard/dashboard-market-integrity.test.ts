import { describe, expect, it } from "vitest";

import { renderDashboardView } from "../../../src/presentation/dashboard/dashboard-view.js";
import { DASHBOARD_CLIENT_SCRIPT } from "../../../src/presentation/dashboard/dashboard-client.js";

describe("integridad de snapshot y affordances del mercado", () => {
  it("define explícitamente ready, stale, partial, degraded, offline y unavailable", () => {
    for (const state of [
      "ready",
      "stale",
      "partial",
      "degraded",
      "offline",
      "unavailable",
    ]) {
      expect(DASHBOARD_CLIENT_SCRIPT).toContain('key:"' + state + '"');
    }
  });

  it("impide presentar acciones de mercado como disponibles cuando el snapshot no es confiable", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain('class="action-disabled"');
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("no es accionable");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("solo lectura");
  });

  it("expone estado y edad de integridad junto al dataset", () => {
    const html = renderDashboardView();
    expect(html).toContain('id="marketIntegrity"');
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("Edad:");
    expect(html).toContain('role="status"');
  });
});
