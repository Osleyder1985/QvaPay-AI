/**
 * @archivo src/presentation/components/escape-html.ts
 * @proposito Proteger el marcado generado por componentes de presentación.
 * @responsabilidades Escapar contenido dinámico sin alterar la lógica de negocio.
 * @ubicacion src/presentation/components dentro de la arquitectura de presentación.
 */

/** Escapa texto dinámico antes de incorporarlo al marcado HTML. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
