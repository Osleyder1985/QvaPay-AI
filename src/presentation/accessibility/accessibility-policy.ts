/**
 * @archivo src/presentation/accessibility/accessibility-policy.ts
 * @proposito Define reglas visuales mínimas de accesibilidad reutilizables por la presentación.
 * @responsabilidades Mantener foco visible, interacción táctil mínima y legibilidad sin depender de un módulo concreto.
 * @ubicacion src/presentation/accessibility dentro de la arquitectura de QvaPay-AI.
 */

export const ACCESSIBILITY_POLICY = String.raw\`<style>
:root{--qva-touch-target:44px}
:where(button,a,input,select,textarea){min-height:var(--qva-touch-target)}
:where(button,a,input,select,textarea):focus-visible{
  outline:2px solid var(--qva-color-focus);
  outline-offset:3px;
}
</style>\`;
