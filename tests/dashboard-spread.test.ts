import { describe, expect, it } from "vitest";
import { DASHBOARD_CLIENT_SCRIPT } from "../src/presentation/dashboard/dashboard-client.js";

describe("contrato de representación del spread en el dashboard", () => {
  it("protege el porcentaje de spread indefinido antes de llamar a toFixed", () => {
    const spreadAssignment = DASHBOARD_CLIENT_SCRIPT.match(
      /\$("spread")\.textContent=([^;]+);/,
    )?.[1];

    expect(spreadAssignment).toBeDefined();
    expect(spreadAssignment).toContain("state.metrics.spreadPercent===null");
    expect(spreadAssignment).toContain(
      "state.metrics.spreadPercent===null?fmt(state.metrics.spread):",
    );
    expect(spreadAssignment).toMatch(
      /state\.metrics\.spreadPercent===null\?[^:]+:[^:]+\.toFixed\(2\)/,
    );
  });
});
