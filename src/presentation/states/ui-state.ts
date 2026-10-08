/**
 * @archivo src/presentation/states/ui-state.ts
 * @proposito Define estados visuales comunes para módulos operativos.
 * @responsabilidades Evitar que cada módulo invente su propio vocabulario de carga, disponibilidad, degradación y error.
 * @ubicacion src/presentation/states dentro de la arquitectura de presentación.
 */

export type UiState =
  | "loading"
  | "ready"
  | "stale"
  | "empty"
  | "partial"
  | "degraded"
  | "error"
  | "unauthorized"
  | "forbidden"
  | "offline"
  | "reconnecting"
  | "success";

export interface UiStateDescriptor {
  readonly state: UiState;
  readonly label: string;
  readonly tone: "neutral" | "positive" | "warning" | "negative";
  readonly allowsDataInteraction: boolean;
}

export const UI_STATE_DESCRIPTORS: Readonly<Record<UiState, UiStateDescriptor>> = {
  loading: { state: "loading", label: "Cargando", tone: "neutral", allowsDataInteraction: false },
  ready: { state: "ready", label: "Actualizado", tone: "positive", allowsDataInteraction: true },
  stale: { state: "stale", label: "Datos potencialmente desactualizados", tone: "warning", allowsDataInteraction: true },
  empty: { state: "empty", label: "Sin datos disponibles", tone: "neutral", allowsDataInteraction: false },
  partial: { state: "partial", label: "Datos parciales", tone: "warning", allowsDataInteraction: true },
  degraded: { state: "degraded", label: "Servicio degradado", tone: "warning", allowsDataInteraction: true },
  error: { state: "error", label: "No se pudo completar la consulta", tone: "negative", allowsDataInteraction: false },
  unauthorized: { state: "unauthorized", label: "Sesión requerida", tone: "warning", allowsDataInteraction: false },
  forbidden: { state: "forbidden", label: "Acceso no permitido", tone: "negative", allowsDataInteraction: false },
  offline: { state: "offline", label: "Sin conexión", tone: "warning", allowsDataInteraction: false },
  reconnecting: { state: "reconnecting", label: "Reconectando", tone: "neutral", allowsDataInteraction: false },
  success: { state: "success", label: "Operación completada", tone: "positive", allowsDataInteraction: true }
};
