/**
 * @archivo src/presentation/patterns/decision-card.ts
 * @proposito Estructurar información orientada a decisiones sin convertirla en ejecución.
 * @responsabilidades Separar contexto, dato principal y estado del sistema.
 * @ubicacion src/presentation/patterns dentro de la arquitectura de presentación.
 */

import { renderDataValue } from "../primitives/data-value.js";
import { renderStatusBadge } from "../primitives/status-badge.js";
import type { UiState } from "../states/ui-state.js";
import { escapeHtml } from "../components/escape-html.js";

/** Genera una tarjeta de decisión informativa sin crear controles de ejecución. */
export function renderDecisionCard(
  title: string,
  context: string,
  value: string,
  state: UiState,
  unit?: string,
): string {
  return (
    '<article class="qva-decision-card">' +
    '<div class="qva-decision-card__heading"><h3>' +
    escapeHtml(title) +
    "</h3>" +
    renderStatusBadge(state) +
    "</div>" +
    '<p class="qva-decision-card__context">' +
    escapeHtml(context) +
    "</p>" +
    '<div class="qva-decision-card__value">' +
    renderDataValue(escapeHtml(value), unit ? escapeHtml(unit) : undefined) +
    "</div></article>"
  );
}
