/**
 * @archivo src/presentation/components/data-table.ts
 * @proposito Presentar conjuntos tabulares de datos ya preparados por capas superiores.
 * @responsabilidades Garantizar estructura accesible y separación clara entre encabezados y valores.
 * @ubicacion src/presentation/components dentro de la arquitectura de presentación.
 */

import { escapeHtml } from "./escape-html.js";

export interface DataTableColumn {
  readonly key: string;
  readonly label: string;
}

export interface DataTableRow {
  readonly id: string;
  readonly cells: Readonly<Record<string, string>>;
}

/** Genera una tabla de datos sin ordenar, calcular ni transformar información financiera. */
export function renderDataTable(
  label: string,
  columns: readonly DataTableColumn[],
  rows: readonly DataTableRow[],
): string {
  const header = columns
    .map((column) => `<th scope="col">${escapeHtml(column.label)}</th>`)
    .join("");
  const body = rows
    .map((row) => {
      const cells = columns
        .map((column) => `<td>${escapeHtml(row.cells[column.key] ?? "—")}</td>`)
        .join("");
      return `<tr data-row-id="${escapeHtml(row.id)}">${cells}</tr>`;
    })
    .join("");
  return `<div class="qva-data-table-wrap"><table class="qva-data-table" aria-label="${escapeHtml(label)}"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`;
}
