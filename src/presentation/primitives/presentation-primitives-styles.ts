/**
 * @archivo src/presentation/primitives/presentation-primitives-styles.ts
 * @proposito Definir estilos compartidos para primitivas de presentación.
 * @responsabilidades Mantener estados visuales consistentes y legibles en todos los módulos.
 * @ubicacion src/presentation/primitives dentro de la arquitectura de presentación.
 */

export const PRESENTATION_PRIMITIVES_STYLES = [
  "<style>",
  ".qva-status{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border:1px solid var(--qva-color-border);border-radius:999px;font:600 12px/1 var(--qva-font-ui)}",
  ".qva-status--ready,.qva-status--success{color:var(--qva-color-positive)}",
  ".qva-status--stale,.qva-status--partial,.qva-status--degraded,.qva-status--offline,.qva-status--unauthorized{color:var(--qva-color-warning)}",
  ".qva-status--error,.qva-status--forbidden{color:var(--qva-color-negative)}",
  ".qva-data-value{display:inline-flex;align-items:baseline;gap:6px;font-family:var(--qva-font-data);font-variant-numeric:tabular-nums}",
  ".qva-data-value__unit{font-family:var(--qva-font-ui);color:var(--qva-color-text-muted);font-size:.8em}",
  "</style>"
].join("");
