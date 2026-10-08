import { describe, expect, it } from "vitest";
import { renderDashboardView } from "../../src/presentation/dashboard/dashboard-view.js";
import { DASHBOARD_CLIENT_SCRIPT } from "../../src/presentation/dashboard/dashboard-client.js";

describe("integridad de interacción del mercado", () => {
  it("expone un límite visible para la validez del snapshot", () => {
    const html = renderDashboardView();
    expect(html).toContain('id="marketIntegrity"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it("define políticas explícitas para ready, stale, partial, degraded, offline y unavailable", () => {
    for (const state of ["READY","STALE","PARTIAL","DEGRADED","OFFLINE","UNAVAILABLE"]) {
      expect(DASHBOARD_CLIENT_SCRIPT).toContain('state:"' + state + '"');
    }
    expect(DASHBOARD_CLIENT_SCRIPT).toContain('age>=interval');
    expect(DASHBOARD_CLIENT_SCRIPT).toContain('state.snapshotStatus==="AVAILABLE"');
    expect(DASHBOARD_CLIENT_SCRIPT).toContain('state.snapshotStatus==="EMPTY"');
    expect(DASHBOARD_CLIENT_SCRIPT).toContain('state.snapshotStatus==="UNAVAILABLE"');
  });
});
