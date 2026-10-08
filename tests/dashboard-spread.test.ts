import { describe, expect, it } from "vitest";
import { DASHBOARD_CLIENT_SCRIPT } from "../src/presentation/dashboard/dashboard-client.js";

describe("contrato de representación del spread en el dashboard", () => {
  it("protege el porcentaje de spread indefinido antes de llamar a toFixed", () => {
    const marker = '$(\"spread\").textContent=';
    const start = DASHBOARD_CLIENT_SCRIPT.indexOf(marker);
    const end = DASHBOARD_CLIENT_SCRIPT.indexOf(";", start);
    const spreadAssignment =
      start >= 0 && end > start
        ? DASHBOARD_CLIENT_SCRIPT.slice(start + marker.length, end)
        : undefined;

    expect(spreadAssignment).toBeDefined();
    expect(spreadAssignment).toMatch(
      /state\.metrics\.spread===null\?[^:]+:[^:]+\.toFixed\(2\)/,
    );
  });
});
