import { describe, expect, it } from "vitest";
import { createLoginAppResponse } from "../../src/infrastructure/cloudflare/login-app.js";

describe("estado de envío del login", () => {
  it("expone busy state y live region para la autenticación", async () => {
    const html = await (await createLoginAppResponse()).text();
    expect(html).toContain('aria-busy="false"');
    expect(html).toContain('id="loginStatus"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('button.setAttribute("aria-disabled","true")');
    expect(html).toContain('form.setAttribute("aria-busy","true")');
    expect(html).toContain('Iniciando sesión…');
  });
});
