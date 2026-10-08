/**
 * @archivo src/presentation/components/empty-state.ts
 * @proposito Comunicar ausencia de datos sin confundirla con un error.
 * @responsabilidades Ofrecer contexto accionable sin crear acciones financieras.
 * @ubicacion src/presentation/components dentro de la arquitectura de presentación.
 */

import { escapeHtml } from "./escape-html.js";

/** Genera un estado vacío semántico y visualmente consistente. */
export function renderEmptyState(title: string, detail: string): string {
  return (
    '<section class="qva-empty-state" role="status">' +
    '<h3>' +
    escapeHtml(title) +
    "</h3>" +
    "<p>" +
    escapeHtml(detail) +
    "</p></section>"
  );
}
