import { describe, expect, it } from "vitest";
import { DASHBOARD_CLIENT_SCRIPT } from "../src/presentation/dashboard/dashboard-client.js";

describe("dashboard spread rendering contract", () => {
  it("guards an undefined spread percentage before calling toFixed", () => {
    const spreadAssignment = DASHBOARD_CLIENT_SCRIPT.match(
      /\$\("spread"\)\.textContent=([^;]+);/,
    )?.[1];

    expect(spreadAssignment).toBeDefined();
    expect(spreadAssignment).toContain("state.metrics.spreadPercent===null");
    expect(spreadAssignment).toMatch(
      /state\.metrics\.spreadPercent===null\?[^:]+:[^:]+\.toFixed\(2\)/,
    );
  });

  it("does not contain the previously unsafe unconditional spreadPercent access", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).not.toContain(
      'state.metrics.spreadPercent.toFixed(2)',
    );
  });
});
