import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DASHBOARD_COMPOSITION } from "../../src/presentation/dashboard/dashboard-composition.js";

describe("frontera de composición del Dashboard", () => {
  it(
    "expone estilos, vista y script como un único contrato de presentación",
    () => {
    expect(DASHBOARD_COMPOSITION.styles).toContain("<style>");
    expect(DASHBOARD_COMPOSITION.body).toContain('id="overview"');
    expect(DASHBOARD_COMPOSITION.script).toContain("<script>");
    },
  );

  it(
    "impide que public-app ensamble directamente recursos concretos del Dashboard",
    () => {
    const path = fileURLToPath(
      new URL("../../src/infrastructure/cloudflare/public-app.ts", import.meta.url),
    );
    const source = readFileSync(path, "utf8");
    expect(source).toContain("dashboard-composition.js");
    expect(source).not.toContain("dashboard-view.js");
    expect(source).not.toContain("dashboard-styles.js");
    expect(source).not.toContain("dashboard-client.js");
    },
  );
});
