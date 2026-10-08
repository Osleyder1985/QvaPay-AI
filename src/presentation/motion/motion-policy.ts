/**
 * @archivo src/presentation/motion/motion-policy.ts
 * @proposito Define la política de movimiento de la interfaz.
 * @responsabilidades Establecer transiciones predecibles y respetar el movimiento reducido.
 * @ubicacion src/presentation/motion dentro de la arquitectura de QvaPay-AI.
 */

const SELECTOR_GLOBAL = ["*", "::before", "::after"].join(",");

export const MOTION_POLICY = [
  "@media (prefers-reduced-motion: reduce){",
  `${SELECTOR_GLOBAL}{`,
  "scroll-behavior:auto !important;",
  "animation-duration:.01ms !important;",
  "animation-iteration-count:1 !important;",
  "transition-duration:.01ms !important;",
  "}",
  "}"
].join("");
