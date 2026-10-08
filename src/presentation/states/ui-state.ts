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

const descriptorEntries = [
  ["loading", "Cargando", "neutral", false],
  ["ready", "Actualizado", "positive", true],
  ["stale", "Datos potencialmente desactualizados", "warning", true],
  ["empty", "Sin datos disponibles", "neutral", false],
  ["partial", "Datos parciales", "warning", true],
  ["degraded", "Servicio degradado", "warning", true],
  ["error", "No se pudo completar la consulta", "negative", false],
  ["unauthorized", "Sesión requerida", "warning", false],
  ["forbidden", "Acceso no permitido", "negative", false],
  ["offline", "Sin conexión", "warning", false],
  ["reconnecting", "Reconectando", "neutral", false],
  ["success", "Operación completada", "positive", true],
] as const;

export const UI_STATE_DESCRIPTORS = Object.fromEntries(
  descriptorEntries.map(([state, label, tone, allowsDataInteraction]) => [
    state,
    { state, label, tone, allowsDataInteraction },
  ]),
) as Record<UiState, UiStateDescriptor>;
