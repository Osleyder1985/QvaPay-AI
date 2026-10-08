/**
 * @archivo src/presentation/components/section-header.ts
 * @proposito Presentar títulos y contexto de una sección operativa.
 * @responsabilidades Crear jerarquía visual consistente sin conocer datos de infraestructura.
 * @ubicacion src/presentation/components dentro de la arquitectura de presentación.
 */

import { escapeHtml } from "./escape-html.js";

/** Genera el encabezado visual de una sección. */
export function renderSectionHeader(title: string, description?: string): string {
  const detail = description
    ? '<p class="qva-section-header__description">' + escapeHtml(description) + "</p>"
    : "";
  return (
    '<header class="qva-section-header">' +
    '<div><h2 class="qva-section-header__title">' +
    escapeHtml(title) +
    "</h2>" +
    detail +
    "</div></header>"
  );
}
