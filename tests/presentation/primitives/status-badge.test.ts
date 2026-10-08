/**
 * @archivo tests/presentation/primitives/status-badge.test.ts
 * @proposito Verificar el marcado accesible de la primitiva de estado.
 * @responsabilidades Mantener un contrato semántico estable para los indicadores de estado.
 * @ubicacion tests/presentation/primitives dentro de la arquitectura de pruebas.
 */

import { describe, expect, it } from "vitest";
import { renderStatusBadge } from "../../../src/presentation/primitives/status-badge.js";

describe("primitiva de estado", () => {
  it("expone estado vivo y etiqueta comprensible", () => {
    const html = renderStatusBadge("degraded");
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Degradado");
  });
});
