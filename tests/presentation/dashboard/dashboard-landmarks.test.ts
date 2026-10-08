import { describe, expect, it } from "vitest";
import { renderDashboardView } from "../../src/presentation/dashboard/dashboard-view.js";
import { renderApplicationShellHeader } from "../../src/infrastructure/cloudflare/application-shell-header.js";

describe("landmarks y headings del dashboard", () => {
  it("nombra el header navegable mediante su heading visible", () => {
    const html = renderApplicationShellHeader();
    expect(html).toContain('id="inicio" aria-labelledby="inicio-title"');
    expect(html).toContain('<h1 id="inicio-title">Dashboard operativo</h1>');
  });

  it("asocia cada región navegable con un heading estable", () => {
    const html = renderDashboardView();
    for (const [id, heading] of [
      ["administracion", "administracion-title"],
      ["cuenta", "cuenta-title"],
      ["controles", "controles-title"],
      ["mercado", "mercado-title"],
      ["operaciones", "operaciones-title"],
      ["auditoria", "auditoria-title"],
      ["seguridad-cuenta", "seguridad-cuenta-title"],
    ]) {
      expect(html).toContain('id="' + id + '" aria-labelledby="' + heading + '"');
      expect(html).toContain('id="' + heading + '"');
    }
  });

  it("mantiene un único destino semántico por cada ancla de navegación", () => {
    const html = renderDashboardView() + renderApplicationShellHeader();
    for (const id of ["inicio", "administracion", "cuenta", "mercado", "operaciones", "controles", "auditoria"]) {
      expect((html.match(new RegExp('id="' + id + '"', "g")) ?? []).length).toBe(1);
    }
  });
});
