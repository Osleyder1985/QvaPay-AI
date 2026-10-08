import { describe, expect, it } from "vitest";
import { DASHBOARD_CLIENT_SCRIPT } from "../../../src/presentation/dashboard/dashboard-client.js";

describe("seguridad y contratos del cliente Dashboard", () => {
  it("no expone directamente payload.error ni detalles de excepciones del backend", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).not.toContain("payload.error||");
    expect(DASHBOARD_CLIENT_SCRIPT).not.toContain(
      "error.message:String(error)",
    );
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("safeError(");
  });

  it("valida tipo de contenido y forma mínima antes de consumir JSON", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      'response.headers.get("content-type")',
    );
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("isScannerState");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("isAccountPayload");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("isUsersPayload");
  });
});
