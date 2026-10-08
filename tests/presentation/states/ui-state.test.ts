/**
 * @archivo tests/presentation/states/ui-state.test.ts
 * @proposito Verificar el contrato común de estados de interfaz.
 * @responsabilidades Impedir que desaparezcan estados críticos de operación y acceso.
 * @ubicacion tests/presentation/states dentro de la arquitectura de pruebas.
 */

import { describe, expect, it } from "vitest";
import { UI_STATE_DESCRIPTORS } from "../../../src/presentation/states/ui-state.js";

describe("estados de interfaz", () => {
  it("cubre estados operativos, de acceso y conectividad", () => {
    expect(UI_STATE_DESCRIPTORS.loading).toBeDefined();
    expect(UI_STATE_DESCRIPTORS.stale).toBeDefined();
    expect(UI_STATE_DESCRIPTORS.degraded).toBeDefined();
    expect(UI_STATE_DESCRIPTORS.unauthorized).toBeDefined();
    expect(UI_STATE_DESCRIPTORS.forbidden).toBeDefined();
    expect(UI_STATE_DESCRIPTORS.offline).toBeDefined();
    expect(UI_STATE_DESCRIPTORS.reconnecting).toBeDefined();
  });

  it("no permite interacción con datos durante estados sin datos confiables", () => {
    expect(UI_STATE_DESCRIPTORS.loading.allowsDataInteraction).toBe(false);
    expect(UI_STATE_DESCRIPTORS.error.allowsDataInteraction).toBe(false);
    expect(UI_STATE_DESCRIPTORS.offline.allowsDataInteraction).toBe(false);
  });
});
