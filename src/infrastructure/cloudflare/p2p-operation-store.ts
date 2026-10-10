/**
 * @archivo src/infrastructure/cloudflare/p2p-operation-store.ts
 * @proposito Mantener la reserva idempotente y los estados persistentes de operaciones P2P.
 * @responsabilidades Evitar reservas duplicadas entre ejecución manual y automática; conservar
 * por separado el resultado de aplicación y el estado de recuperación del detalle.
 * @seguridad La restricción única de D1 es la autoridad de concurrencia; los estados ambiguos
 * nunca liberan una oferta para un segundo POST.
 * @ubicacion Infraestructura Cloudflare/D1 del módulo de operaciones P2P.
 */

import type { D1Database } from "@cloudflare/workers-types";

export type P2POperationSource = "MANUAL" | "AUTO_APPLY";
export type P2PApplyStatus =
  | "RESERVED"
  | "APPLYING"
  | "CONFIRMED"
  | "REJECTED"
  | "AMBIGUOUS";
export type P2PDetailStatus =
  | "NOT_REQUESTED"
  | "PENDING"
  | "AVAILABLE"
  | "FAILED";
export type P2PDetailErrorCode =
  | "TIMEOUT"
  | "HTTP_5XX"
  | "UNAVAILABLE"
  | "CONTRACT";

export interface P2POperation {
  readonly id: string;
  readonly offerUuid: string;
  readonly source: P2POperationSource;
  readonly actorUserId: string | null;
  readonly actorUsername: string | null;
  readonly applyStatus: P2PApplyStatus;
  readonly detailStatus: P2PDetailStatus;
  readonly providerHttpStatus: number | null;
  readonly detailErrorCode: P2PDetailErrorCode | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ReserveP2POperationInput {
  readonly offerUuid: string;
  readonly source: P2POperationSource;
  readonly actorUserId: string | null;
  readonly actorUsername: string | null;
  readonly now?: string;
}

export interface ReserveP2POperationResult {
  readonly operation: P2POperation;
  readonly created: boolean;
}

function rowToOperation(row: Record<string, unknown>): P2POperation {
  return {
    id: String(row.id),
    offerUuid: String(row.offer_uuid),
    source: String(row.source) as P2POperationSource,
    actorUserId: row.actor_user_id == null ? null : String(row.actor_user_id),
    actorUsername:
      row.actor_username == null ? null : String(row.actor_username),
    applyStatus: String(row.apply_status) as P2PApplyStatus,
    detailStatus: String(row.detail_status) as P2PDetailStatus,
    providerHttpStatus:
      row.provider_http_status == null
        ? null
        : Number(row.provider_http_status),
    detailErrorCode:
      row.detail_error_code == null
        ? null
        : (String(row.detail_error_code) as P2PDetailErrorCode),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/**
 * @proposito Reservar una oferta P2P mediante una inserción idempotente.
 * @responsabilidades Usar la restricción única de D1 para que solo un origen gane
 * la carrera; las llamadas posteriores recuperan la operación existente.
 * @param db Base de datos D1.
 * @param input Identidad de la oferta, origen y actor que solicita la reserva.
 * @returns Operación persistida e indicador de si esta llamada la creó.
 */
export async function reserveP2POperation(
  db: D1Database,
  input: ReserveP2POperationInput,
): Promise<ReserveP2POperationResult> {
  const offerUuid = input.offerUuid.trim();
  if (!offerUuid || offerUuid.length > 200) {
    throw new Error("El identificador de oferta P2P no es válido.");
  }
  if (input.source !== "MANUAL" && input.source !== "AUTO_APPLY") {
    throw new Error("El origen de la operación P2P no es válido.");
  }

  const now = input.now ?? new Date().toISOString();
  const id = crypto.randomUUID();
  const result = await db
    .prepare(
      "INSERT INTO p2p_operations (id, offer_uuid, source, actor_user_id, actor_username, apply_status, detail_status, provider_http_status, detail_error_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'RESERVED', 'NOT_REQUESTED', NULL, NULL, ?, ?) ON CONFLICT(offer_uuid) DO NOTHING",
    )
    .bind(
      id,
      offerUuid,
      input.source,
      input.actorUserId,
      input.actorUsername,
      now,
      now,
    )
    .run();

  const created = Number(result.meta?.changes ?? 0) === 1;
  const row = await db
    .prepare(
      "SELECT id, offer_uuid, source, actor_user_id, actor_username, apply_status, detail_status, provider_http_status, detail_error_code, created_at, updated_at FROM p2p_operations WHERE offer_uuid = ? LIMIT 1",
    )
    .bind(offerUuid)
    .first<Record<string, unknown>>();

  if (!row) {
    throw new Error("No se pudo recuperar la reserva de la operación P2P.");
  }

  return { operation: rowToOperation(row), created };
}

/**
 * @proposito Reclamar la ejecución de una operación previamente reservada.
 * @responsabilidades Aplicar una transición condicional RESERVADO→EN EJECUCIÓN
 * para que una reserva no pueda ser reclamada dos veces.
 * @param db Base de datos D1.
 * @param operationId Identificador persistido de la operación.
 * @param now Marca temporal ISO 8601 opcional para pruebas deterministas.
 * @returns true si esta llamada ganó la transición; false si otro actor ya la reclamó.
 */
export async function claimP2POperation(
  db: D1Database,
  operationId: string,
  now = new Date().toISOString(),
): Promise<boolean> {
  const result = await db
    .prepare(
      "UPDATE p2p_operations SET apply_status = 'APPLYING', updated_at = ? WHERE id = ? AND apply_status = 'RESERVED'",
    )
    .bind(now, operationId)
    .run();
  return Number(result.meta?.changes ?? 0) === 1;
}

/**
 * @proposito Persistir el resultado autoritativo de la solicitud de aplicación.
 * @responsabilidades Conservar resultados confirmados, rechazados o ambiguos sin
 * liberar la restricción única de la oferta; un apply confirmado abre el estado de detalle.
 * @param db Base de datos D1.
 * @param operationId Identificador persistido de la operación.
 * @param status Estado final del intento de aplicación.
 * @param providerHttpStatus Código HTTP del proveedor, si se recibió.
 * @param now Marca temporal ISO 8601 opcional para pruebas deterministas.
 * @returns true si se realizó la transición desde APPLYING.
 */
export async function recordP2PApplyOutcome(
  db: D1Database,
  operationId: string,
  status: Extract<P2PApplyStatus, "CONFIRMED" | "REJECTED" | "AMBIGUOUS">,
  providerHttpStatus: number | null,
  now = new Date().toISOString(),
): Promise<boolean> {
  const detailStatus: P2PDetailStatus =
    status === "CONFIRMED" ? "PENDING" : "NOT_REQUESTED";
  const result = await db
    .prepare(
      "UPDATE p2p_operations SET apply_status = ?, detail_status = ?, provider_http_status = ?, detail_error_code = NULL, updated_at = ? WHERE id = ? AND apply_status = 'APPLYING'",
    )
    .bind(status, detailStatus, providerHttpStatus, now, operationId)
    .run();
  return Number(result.meta?.changes ?? 0) === 1;
}

/**
 * @proposito Registrar por separado el resultado de recuperación del detalle.
 * @responsabilidades No cambiar el resultado de aplicación; permitir reintentar solo
 * la consulta de detalle cuando su estado anterior sea PENDING o FAILED.
 * @param db Base de datos D1.
 * @param operationId Identificador persistido de la operación.
 * @param outcome Resultado de la consulta de detalle.
 * @param now Marca temporal ISO 8601 opcional para pruebas deterministas.
 * @returns true si se actualizó un detalle pendiente de una aplicación confirmada.
 */
export async function recordP2PDetailOutcome(
  db: D1Database,
  operationId: string,
  outcome:
    | { readonly available: true }
    | {
        readonly available: false;
        readonly errorCode: P2PDetailErrorCode;
      },
  now = new Date().toISOString(),
): Promise<boolean> {
  const detailStatus = outcome.available ? "AVAILABLE" : "FAILED";
  const errorCode = outcome.available ? null : outcome.errorCode;
  const result = await db
    .prepare(
      "UPDATE p2p_operations SET detail_status = ?, detail_error_code = ?, updated_at = ? WHERE id = ? AND apply_status = 'CONFIRMED' AND detail_status IN ('PENDING', 'FAILED')",
    )
    .bind(detailStatus, errorCode, now, operationId)
    .run();
  return Number(result.meta?.changes ?? 0) === 1;
}

/**
 * @proposito Consultar una operación por su identificador estable.
 * @responsabilidades Recuperar el estado persistido sin invocar al proveedor.
 * @param db Base de datos D1.
 * @param operationId Identificador persistido de la operación.
 * @returns Operación existente o null.
 */
export async function getP2POperation(
  db: D1Database,
  operationId: string,
): Promise<P2POperation | null> {
  const row = await db
    .prepare(
      "SELECT id, offer_uuid, source, actor_user_id, actor_username, apply_status, detail_status, provider_http_status, detail_error_code, created_at, updated_at FROM p2p_operations WHERE id = ? LIMIT 1",
    )
    .bind(operationId)
    .first<Record<string, unknown>>();
  return row ? rowToOperation(row) : null;
}
