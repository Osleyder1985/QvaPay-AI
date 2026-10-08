import { describe, expect, it } from "vitest";

import { createPublicAppResponse } from "../../../src/infrastructure/cloudflare/public-app.js";

describe("integridad de snapshot y affordances del mercado", () => {
  it("define explícitamente ready, stale, partial, degraded, offline y unavailable", async () => {
    const html = await createPublicAppResponse().text();
    for (const state of [
      "ready",
      "stale",
      "partial",
      "degraded",
      "offline",
      "unavailable",
    ]) {
      expect(html).toContain('key:"' + state + '"');
    }
  });

  it("impide presentar acciones de mercado como disponibles cuando el snapshot no es confiable", async () => {
    const html = await createPublicAppResponse().text();
    expect(html).toContain('class="action-disabled"');
    expect(html).toContain("no es accionable");
    expect(html).toContain("solo lectura");
  });

  it("expone estado y edad de integridad junto al dataset", async () => {
    const html = await createPublicAppResponse().text();
    expect(html).toContain('id="marketIntegrity"');
    expect(html).toContain("Edad:");
    expect(html).toContain('role="status"');
  });
});
