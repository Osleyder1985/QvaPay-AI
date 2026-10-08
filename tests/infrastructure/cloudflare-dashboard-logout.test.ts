import { describe, expect, it } from "vitest";
import { createPublicAppResponse } from "../../src/infrastructure/cloudflare/public-app.js";

describe("logout autenticado del dashboard", () => {
  it("expone un control accesible que invoca el endpoint server-side autorizado", async () => {
    const html = await createPublicAppResponse().text();

    expect(html).toContain('id="logoutButton"');
    expect(html).toContain('type="button">Cerrar sesión');
    expect(html).toContain('fetch("/api/auth/logout"');
    expect(html).toContain('method:"POST"');
    expect(html).toContain('credentials:"same-origin"');
    expect(html).toContain("response.status!==401");
  });

  it("mantiene el control en estado pendiente durante la solicitud", async () => {
    const html = await createPublicAppResponse().text();

    expect(html).toContain('button.setAttribute("aria-busy","true")');
    expect(html).toContain("button.disabled=false");
    expect(html).toContain('textContent="Cerrar sesión"');
  });
});
