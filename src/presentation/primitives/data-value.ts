/**
 * @archivo src/presentation/primitives/data-value.ts
 * @proposito Normalizar la presentación tipográfica de valores de datos.
 * @responsabilidades Separar visualmente cifras y unidades sin calcular ni transformar datos financieros.
 * @ubicacion src/presentation/primitives dentro de la arquitectura de presentación.
 */

/** Genera la presentación tipográfica de un valor sin modificar su contenido. */
export function renderDataValue(value: string, unit?: string): string {
  const suffix = unit ? `<span class="qva-data-value__unit">${unit}</span>` : "";
  return `<span class="qva-data-value"><span class="qva-data-value__number">${value}</span>${suffix}</span>`;
}
