import { describe, expect, it } from "vitest";
import { DASHBOARD_CLIENT_SCRIPT } from "../src/presentation/dashboard/dashboard-client.js";

describe("contrato de representación del spread en el dashboard", () => {
  it("protege el porcentaje de spread indefinido antes de llamar a toFixed", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      'setText("spread",state.metrics.spread===null?"—":state.metrics.spreadPercent===null?fmt(state.metrics.spread):',
    );
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      "state.metrics.spreadPercent===null?fmt(state.metrics.spread):",
    );
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      "state.metrics.spreadPercent.toFixed(2)",
    );
  });
});
