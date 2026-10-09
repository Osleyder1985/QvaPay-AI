import { describe, expect, it } from "vitest";

import { renderDashboardView } from "../../../src/presentation/dashboard/dashboard-view.js";
import { renderApplicationShellHeader } from "../../../src/infrastructure/cloudflare/application-shell-header.js";

describe("landmarks y relaciones de encabezados del Dashboard", () => {
  it("nombra el header mediante su heading visible", () => {
    const html = renderApplicationShellHeader();
    expect(html).toContain('aria-labelledby="page-title"');
    expect(html).toContain('id="page-title"');
  });

  it("asocia cada región navegable con un heading estable", () => {
    const html = renderDashboardView();
    for (const id of [
      "administracion",
      "cuenta",
      "controles",
      "mercado",
      "operaciones",
      "auditoria",
      "seguridad-cuenta",
    ]) {
      expect(html).toContain('id="' + id + '"');
    }
    expect(html).toContain('aria-labelledby="administracion-title"');
    expect(html).toContain('aria-labelledby="cuenta-title"');
    expect(html).toContain('aria-labelledby="controles-title"');
    expect(html).toContain('aria-labelledby="mercado-title"');
    expect(html).toContain('aria-labelledby="operaciones-title"');
    expect(html).toContain('aria-labelledby="auditoria-title"');
    expect(html).toContain('aria-labelledby="seguridad-cuenta-title"');
  });
});
