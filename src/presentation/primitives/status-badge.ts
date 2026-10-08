/**
 * @archivo src/presentation/primitives/status-badge.ts
 * @proposito Proporcionar una representación visual uniforme de estados del sistema.
 * @responsabilidades Generar marcado semántico sin incorporar lógica de negocio ni autoridad financiera.
 * @ubicacion src/presentation/primitives dentro de la arquitectura de presentación.
 */

import type { UiState } from "../states/ui-state.js";

/** Genera un indicador accesible para el estado visual proporcionado. */
export function renderStatusBadge(state: UiState): string {
  const labels: Record<UiState, string> = {
    loading: "Cargando",
    ready: "Actualizado",
    stale: "Desactualizado",
    empty: "Sin datos",
    partial: "Parcial",
    degraded: "Degradado",
    error: "Error",
    unauthorized: "Sesión requerida",
    forbidden: "Acceso denegado",
    offline: "Sin conexión",
    reconnecting: "Reconectando",
    success: "Completado"
  };

  return `<span class="qva-status qva-status--${state}" role="status" aria-live="polite">${labels[state]}</span>`;
}
