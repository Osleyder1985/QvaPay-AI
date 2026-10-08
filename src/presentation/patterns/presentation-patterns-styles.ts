/**
 * @archivo src/presentation/patterns/presentation-patterns-styles.ts
 * @proposito Estilizar patrones de composición operativa.
 * @responsabilidades Mantener separación visual entre contexto, estado y datos.
 * @ubicacion src/presentation/patterns dentro de la arquitectura de presentación.
 */

export const PRESENTATION_PATTERN_STYLES = [
  "<style>",
  ".qva-operational-panel{display:grid;gap:var(--qva-space-4);min-width:0}",
  ".qva-operational-panel__content{min-width:0}",
  ".qva-decision-card{display:grid;gap:var(--qva-space-3);padding:var(--qva-space-5);background:var(--qva-color-surface-raised);border:1px solid var(--qva-color-border);border-radius:var(--qva-radius-lg)}",
  ".qva-decision-card__heading{display:flex;align-items:center;justify-content:space-between;gap:var(--qva-space-3)}",
  ".qva-decision-card h3{margin:0;font:700 15px/1.35 var(--qva-font-ui)}",
  ".qva-decision-card__context{margin:0;color:var(--qva-color-text-muted);font:13px/1.45 var(--qva-font-ui)}",
  ".qva-decision-card__value{font-size:24px;font-weight:700;overflow:auto}",
  "</style>",
].join("");
