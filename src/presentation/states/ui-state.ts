/**
 * @archivo src/presentation/states/ui-state.ts
 * @proposito Define estados visuales comunes para módulos operativos.
 * @responsabilidades Evitar vocabularios diferentes entre módulos.
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

const descriptor = (
  state: UiState,
  label: string,
  tone: UiStateDescriptor["tone"],
  allowsDataInteraction: boolean,
): UiStateDescriptor => ({
  state,
  label,
  tone,
  allowsDataInteraction,
});

const descriptors: Record<UiState, UiStateDescriptor> = {
  loading: descriptor("loading", "Cargando", "neutral", false),
  ready: descriptor("ready", "Actualizado", "positive", true),
  stale: descriptor(
    "stale",
    "Datos potencialmente desactualizados",
    "warning",
    true,
  ),
  empty: descriptor("empty", "Sin datos disponibles", "neutral", false),
  partial: descriptor("partial", "Datos parciales", "warning", true),
  degraded: descriptor("degraded", "Servicio degradado", "warning", true),
  error: descriptor(
    "error",
    "No se pudo completar la consulta",
    "negative",
    false,
  ),
  unauthorized: descriptor(
    "unauthorized",
    "Sesión requerida",
    "warning",
    false,
  ),
  forbidden: descriptor(
    "forbidden",
    "Acceso no permitido",
    "negative",
    false,
  ),
  offline: descriptor("offline", "Sin conexión", "warning", false),
  reconnecting: descriptor(
    "reconnecting",
    "Reconectando",
    "neutral",
    false,
  ),
  success: descriptor("success", "Operación completada", "positive", true),
};

export const UI_STATE_DESCRIPTORS: Readonly<
  Record<UiState, UiStateDescriptor>
> = descriptors;
