/**
 * @archivo tests/presentation/dashboard/dashboard-presentation.test.ts
 * @proposito Verificar que la presentación del Dashboard permanezca separada por responsabilidades.
 * @responsabilidades Validar el contrato mínimo de vista, estilos y comportamiento de navegador.
 */

import { describe, expect, it } from "vitest";
import { DASHBOARD_CLIENT_SCRIPT } from "../../../src/presentation/dashboard/dashboard-client.js";
import { DASHBOARD_STYLES } from "../../../src/presentation/dashboard/dashboard-styles.js";
import { renderDashboardView } from "../../../src/presentation/dashboard/dashboard-view.js";

describe("presentación del Dashboard", () => {
  it("expone la estructura funcional como módulo independiente", () => {
    const view = renderDashboardView();

    expect(view).toContain('id="overview"');
    expect(view).toContain('id="mercado"');
    expect(view).toContain('id="operaciones"');
    expect(view).toContain('id="auditoria"');
    expect(view).not.toContain("<script>");
    expect(view).not.toContain("<style>");
  });

  it("expone estilos y comportamiento como recursos independientes", () => {
    expect(DASHBOARD_STYLES).toContain("<style>");
    expect(DASHBOARD_STYLES).toContain("</style>");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("<script>");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("</script>");
  });
});
