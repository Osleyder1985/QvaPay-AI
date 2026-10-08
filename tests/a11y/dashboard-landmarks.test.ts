import { describe, expect, it } from "vitest";
import { renderDashboardView } from "../../src/presentation/dashboard/dashboard-view.js";
import { APPLICATION_SHELL_MODULES } from "../../src/infrastructure/cloudflare/application-shell.js";

describe("landmarks del dashboard", () => {
  it("asocia cada región principal con su encabezado visible", () => {
    const html = renderDashboardView();
    for (const id of ["administracion", "cuenta", "controles", "mercado", "operaciones", "auditoria"]) {
      expect(html).toContain('id="' + id + '" aria-labelledby="' + id + '-heading"');
      expect(html).toContain('<h2 id="' + id + '-heading"');
    }
    expect(html).toContain('id="seguridad-cuenta" aria-labelledby="seguridad-cuenta-heading"');
    expect(html).toContain('<h3 id="seguridad-cuenta-heading">');
  });

  it("mantiene objetivos de navegación únicos", () => {
    const html = renderDashboardView();
    for (const module of APPLICATION_SHELL_MODULES) {
      const target = module.href.slice(1);
      if (target === "inicio") continue;
      expect((html.match(new RegExp('id="' + target + '"', "g")) ?? []).length).toBe(1);
    }
  });
});
