/**
 * @archivo tests/presentation/tokens/design-tokens.test.ts
 * @proposito Verificar que los contratos visuales globales permanezcan disponibles.
 * @responsabilidades Comprobar la presencia de tokens de estado, tipografía, espaciado y accesibilidad.
 * @ubicacion tests/presentation/tokens dentro de la arquitectura de pruebas de QvaPay-AI.
 */

import { describe, expect, it } from "vitest";
import { ACCESSIBILITY_POLICY } from "../../../src/presentation/accessibility/accessibility-policy.js";
import { MOTION_POLICY } from "../../../src/presentation/motion/motion-policy.js";
import { DESIGN_TOKENS } from "../../../src/presentation/tokens/design-tokens.js";

describe("sistema de diseño de presentación", () => {
  it("expone tokens visuales semánticos", () => {
    expect(DESIGN_TOKENS).toContain("--qva-color-background");
    expect(DESIGN_TOKENS).toContain("--qva-color-positive");
    expect(DESIGN_TOKENS).toContain("--qva-color-negative");
    expect(DESIGN_TOKENS).toContain("--qva-font-data");
    expect(DESIGN_TOKENS).toContain("--qva-space-4");
  });

  it("gobierna movimiento y accesibilidad", () => {
    expect(MOTION_POLICY).toContain("prefers-reduced-motion");
    expect(ACCESSIBILITY_POLICY).toContain("--qva-touch-target:44px");
    expect(ACCESSIBILITY_POLICY).toContain("focus-visible");
  });
});
