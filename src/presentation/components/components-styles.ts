/**
 * @archivo src/presentation/components/components-styles.ts
 * @proposito Estilizar componentes reutilizables de presentación.
 * @responsabilidades Mantener jerarquía, legibilidad, responsive y estados sin acoplamiento a módulos.
 * @ubicacion src/presentation/components dentro de la arquitectura de presentación.
 */

export const PRESENTATION_COMPONENT_STYLES = [
  "<style>",
  ".qva-section-header{display:flex;align-items:end;justify-content:space-between;gap:var(--qva-space-4);margin-block:0 var(--qva-space-4)}",
  ".qva-section-header__title{margin:0;color:var(--qva-color-text);font:700 20px/1.25 var(--qva-font-ui)}",
  ".qva-section-header__description{margin:6px 0 0;color:var(--qva-color-text-muted);font:14px/1.45 var(--qva-font-ui)}",
  ".qva-metric-card{display:grid;gap:var(--qva-space-4);min-width:0;padding:var(--qva-space-5);background:var(--qva-color-surface);border:1px solid var(--qva-color-border);border-radius:var(--qva-radius-lg);box-shadow:var(--qva-shadow-panel)}",
  ".qva-metric-card__meta{display:flex;align-items:center;justify-content:space-between;gap:var(--qva-space-3);color:var(--qva-color-text-muted);font:600 13px/1.3 var(--qva-font-ui)}",
  ".qva-metric-card__value{font-size:clamp(24px,4vw,36px);font-weight:700;overflow:auto}",
  ".qva-status-panel{display:grid;gap:var(--qva-space-3);padding:var(--qva-space-5);background:var(--qva-color-surface);border:1px solid var(--qva-color-border);border-radius:var(--qva-radius-lg)}",
  ".qva-status-panel__heading{display:flex;align-items:center;justify-content:space-between;gap:var(--qva-space-3)}",
  ".qva-status-panel h3{margin:0;font:700 16px/1.3 var(--qva-font-ui)}",
  ".qva-status-panel__detail,.qva-status-panel__interaction{margin:0;color:var(--qva-color-text-muted);font:14px/1.5 var(--qva-font-ui)}",
  ".qva-empty-state{padding:var(--qva-space-8);text-align:center;background:var(--qva-color-surface);border:1px dashed var(--qva-color-border);border-radius:var(--qva-radius-lg)}",
  ".qva-empty-state h3{margin:0 0 8px;font:700 16px/1.3 var(--qva-font-ui)}",
  ".qva-empty-state p{margin:0;color:var(--qva-color-text-muted);font:14px/1.5 var(--qva-font-ui)}",
  ".qva-alert{display:flex;align-items:flex-start;gap:var(--qva-space-3);padding:var(--qva-space-4);border:1px solid var(--qva-color-border);border-radius:var(--qva-radius-md);font:14px/1.45 var(--qva-font-ui)}",
  ".qva-alert--positive{border-color:var(--qva-color-positive)}.qva-alert--warning{border-color:var(--qva-color-warning)}.qva-alert--negative{border-color:var(--qva-color-negative)}",
  ".qva-data-table-wrap{width:100%;overflow:auto;border:1px solid var(--qva-color-border);border-radius:var(--qva-radius-lg);background:var(--qva-color-surface)}",
  ".qva-data-table{width:100%;min-width:620px;border-collapse:collapse;font:14px/1.4 var(--qva-font-ui)}",
  ".qva-data-table th,.qva-data-table td{padding:12px 16px;border-bottom:1px solid var(--qva-color-border);text-align:left;white-space:nowrap}",
  ".qva-data-table th{color:var(--qva-color-text-muted);font-size:12px;text-transform:uppercase;letter-spacing:.04em}",
  ".qva-data-table td{color:var(--qva-color-text)}.qva-data-table tbody tr:last-child td{border-bottom:0}",
  "@media (max-width:720px){.qva-metric-card{padding:16px}.qva-section-header{align-items:flex-start}.qva-data-table{min-width:560px}}",
  "</style>",
].join("");
