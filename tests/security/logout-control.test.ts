import { describe, expect, it } from "vitest";
import { renderApplicationShellHeader } from "../../src/infrastructure/cloudflare/application-shell-header.js";
import { DASHBOARD_CLIENT_SCRIPT } from "../../src/presentation/dashboard/dashboard-client.js";

describe("control de cierre de sesión", () => {
  it("expone un control accesible en el shell", () => {
    const html = renderApplicationShellHeader();
    expect(html).toContain('id="logoutButton"');
    expect(html).toContain('type="button"');
    expect(html).toContain("Cerrar sesión");
    expect(html).toContain('id="logoutMessage"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it("invoca el endpoint server-side y maneja sesión expirada o error de transporte", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain('fetch("/api/auth/logout"');
    expect(DASHBOARD_CLIENT_SCRIPT).toContain('response.status===204||response.status===401');
    expect(DASHBOARD_CLIENT_SCRIPT).toContain('credentials:"same-origin"');
    expect(DASHBOARD_CLIENT_SCRIPT).toContain('button.setAttribute("aria-busy","true")');
    expect(DASHBOARD_CLIENT_SCRIPT).toContain('button.disabled=false');
  });
});
