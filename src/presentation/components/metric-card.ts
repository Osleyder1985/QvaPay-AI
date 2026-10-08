/**
 * @archivo src/presentation/components/metric-card.ts
 * @proposito Presentar una métrica ya calculada por una fuente autorizada.
 * @responsabilidades Dar jerarquía visual a cifras sin calcularlas ni mutarlas.
 * @ubicacion src/presentation/components dentro de la arquitectura de presentación.
 */

import { renderDataValue } from "../primitives/data-value.js";
import { renderStatusBadge } from "../primitives/status-badge.js";
import type { UiState } from "../states/ui-state.js";
import { escapeHtml } from "./escape-html.js";

/** Genera una tarjeta de métrica con un valor recibido de forma inmutable. */
export function renderMetricCard(
  label: string,
  value: string,
  state: UiState,
  unit?: string,
): string {
  return (
    '<article class="qva-metric-card">' +
    '<div class="qva-metric-card__meta"><span>' +
    escapeHtml(label) +
    "</span>" +
    renderStatusBadge(state) +
    "</div>" +
    '<div class="qva-metric-card__value">' +
    renderDataValue(escapeHtml(value), unit ? escapeHtml(unit) : undefined) +
    "</div></article>"
  );
}
