/**
 * @archivo src/presentation/patterns/operational-panel.ts
 * @proposito Componer encabezado, estado y contenido de un panel operativo.
 * @responsabilidades Establecer una composición reutilizable sin acoplarse a infraestructura ni ejecución financiera.
 * @ubicacion src/presentation/patterns dentro de la arquitectura de presentación.
 */

import type { UiState } from "../states/ui-state.js";
import { renderSectionHeader } from "../components/section-header.js";
import { renderStatusPanel } from "../components/status-panel.js";

/** Compone un panel operativo a partir de estado y contenido ya autorizado. */
export function renderOperationalPanel(
  title: string,
  description: string,
  state: UiState,
  stateTitle: string,
  stateDetail: string,
  content: string,
): string {
  return (
    '<section class="qva-operational-panel">' +
    renderSectionHeader(title, description) +
    renderStatusPanel(state, stateTitle, stateDetail) +
    '<div class="qva-operational-panel__content">' +
    content +
    "</div></section>"
  );
}
