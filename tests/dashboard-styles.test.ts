import { describe, expect, it } from "vitest";
import { DASHBOARD_STYLES } from "../src/presentation/dashboard/dashboard-styles.js";

describe("contrato de estilos del dashboard", () => {
  it("emite todo el CSS dentro de un único elemento style", () => {
    expect(DASHBOARD_STYLES.startsWith("<style>")).toBe(true);
    expect(DASHBOARD_STYLES.endsWith("</style>")).toBe(true);
    expect((DASHBOARD_STYLES.match(/<style>/g) ?? []).length).toBe(1);
    expect((DASHBOARD_STYLES.match(/<\/style>/g) ?? []).length).toBe(1);
  });

  it("no expone tokens CSS como texto HTML fuera de un contexto de estilos", () => {
    expect(DASHBOARD_STYLES).toContain("--qva-color-background:#070b14;");
    expect(DASHBOARD_STYLES).not.toMatch(/^:root\{/);
  });
});
