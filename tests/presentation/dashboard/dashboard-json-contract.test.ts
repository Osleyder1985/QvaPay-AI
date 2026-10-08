import { describe, expect, it } from "vitest";

import { DASHBOARD_CLIENT_SCRIPT } from "../../../src/presentation/dashboard/dashboard-client.js";

describe("contratos JSON del Dashboard", () => {
  it("rechaza respuestas sin application/json o con formas no objeto", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      'response.headers.get("content-type")',
    );
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      "Respuesta de contrato no válida.",
    );
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("Array.isArray(payload)");
  });

  it("valida las formas mínimas antes de mutar el estado renderizado", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("isScannerState(payload)");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("isAccountPayload(payload)");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("isUsersPayload(payload)");
  });
});
