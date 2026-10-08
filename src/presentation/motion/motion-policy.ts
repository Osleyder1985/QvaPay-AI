/**
 * @archivo src/presentation/motion/motion-policy.ts
 * @proposito Define la política de movimiento de la interfaz.
 * @responsabilidades Establecer transiciones predecibles y respetar la preferencia de movimiento reducido del usuario.
 * @ubicacion src/presentation/motion dentro de la arquitectura de QvaPay-AI.
 */

export const MOTION_POLICY = String.raw\`<style>
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{
    scroll-behavior:auto !important;
    animation-duration:.01ms !important;
    animation-iteration-count:1 !important;
    transition-duration:.01ms !important;
  }
}
</style>\`;
