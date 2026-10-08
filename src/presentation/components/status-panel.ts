/**
 * @archivo src/presentation/components/status-panel.ts
 * @proposito Presentar un estado de módulo con contexto y límites de interacción.
 * @responsabilidades Hacer explícita la condición de los datos sin autorizar operaciones financieras.
 * @ubicacion src/presentation/components dentro de la arquitectura de presentación.
 */

import { UI_STATE_DESCRIPTORS, type UiState } from "../states/ui-state.js";
import { renderStatusBadge } from "../primitives/status-badge.js";
import { escapeHtml } from "./escape-html.js";

/** Genera un panel de estado coherente con el modelo visual del sistema. */
export function renderStatusPanel(state: UiState, title: string, detail: string): string {
  const descriptor = UI_STATE_DESCRIPTORS[state];
  return (
    '<section class="qva-status-panel qva-status-panel--' +
    state +
    '" aria-live="polite">' +
    '<div class="qva-status-panel__heading">' +
    '<h3>' +
    escapeHtml(title) +
    "</h3>" +
    renderStatusBadge(state) +
    "</div>" +
    '<p class="qva-status-panel__detail">' +
    escapeHtml(detail) +
    "</p>" +
    '<small class="qva-status-panel__interaction">' +
    (descriptor.allowsDataInteraction
      ? "Los datos pueden consultarse según los permisos vigentes."
      : "La interacción con datos está limitada hasta resolver este estado.") +
    "</small></section>"
  );
}
