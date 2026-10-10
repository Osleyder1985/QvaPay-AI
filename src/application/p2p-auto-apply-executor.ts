/**
 * @archivo src/application/p2p-auto-apply-executor.ts
 * @proposito Definir la frontera segura entre una decisión Auto Apply y una operación persistida.
 * @responsabilidades Orquestar evaluación, auditoría previa, reclamación idempotente y una única invocación al proveedor mediante puertos inyectados.
 * @dependencias Evaluador puro Auto Apply y puertos definidos en este módulo.
 * @seguridad El modo desactivado es el valor predeterminado; errores ambiguos no provocan reintentos; no incluye adaptadores reales ni credenciales.
 * @superficie-publica AutoApplyExecutionPorts, AutoApplyExecutionResult, executeAutoApplyCandidate.
 * @mantenimiento Implementar adaptadores D1/proveedor solo después de pruebas de concurrencia y revisión independiente.
 * @ubicacion Capa de aplicación de operaciones P2P.
 */
import type { Offer } from "../domain/offer.js";
import {
  evaluateAutoApplyDecision,
  type AutoApplyDecisionInput,
} from "./p2p-auto-apply-decision.js";

/** Datos mínimos de una estrategia; enabled debe resolverse como false si no hay configuración válida. */
export interface AutoApplyStrategy {
  readonly enabled: boolean;
  readonly decision: Omit<AutoApplyDecisionInput, "offer" | "enabled">;
}

/** Reserva persistida de manera idempotente y compartida por origen manual/automático. */
export interface AutoApplyReservation {
  readonly operationId: string;
  readonly created: boolean;
  readonly status:
    "RESERVED" | "APPLYING" | "CONFIRMED" | "REJECTED" | "AMBIGUOUS";
}

/** Puertos obligatorios: la implementación concreta no puede ocultar persistencia ni llamadas remotas. */
export interface AutoApplyExecutionPorts {
  loadStrategy(): Promise<AutoApplyStrategy | null>;
  loadEligibleOffers(): Promise<readonly Offer[]>;
  reserve(offerUuid: string): Promise<AutoApplyReservation>;
  recordDecision(input: {
    readonly offerUuid: string;
    readonly eligible: boolean;
    readonly reason: string;
    readonly operationId: string | null;
  }): Promise<void>;
  claim(operationId: string): Promise<boolean>;
  applyOnce(
    offerUuid: string,
  ): Promise<
    | { readonly status: "CONFIRMED" }
    | { readonly status: "REJECTED"; readonly httpStatus: number }
    | { readonly status: "AMBIGUOUS"; readonly httpStatus: number | null }
  >;
  recordOutcome(
    operationId: string,
    status: "CONFIRMED" | "REJECTED" | "AMBIGUOUS",
    httpStatus: number | null,
  ): Promise<void>;
  releaseUnclaimed(operationId: string): Promise<void>;
}

export interface AutoApplyExecutionResult {
  readonly examined: number;
  readonly eligible: number;
  readonly attempted: number;
  readonly skipped: number;
}

/**
 * @proposito Procesar candidatos sin convertir una decisión elegible en permiso implícito para operar.
 * @responsabilidades Auditar antes del POST, reclamar una sola vez y persistir resultado sin reintentos.
 * @param ports Adaptadores explícitos de estrategia, snapshots, persistencia y proveedor.
 * @returns Conteos agregados sin secretos ni cuerpos remotos.
 */
export async function executeAutoApplyCandidate(
  ports: AutoApplyExecutionPorts,
): Promise<AutoApplyExecutionResult> {
  const strategy = await ports.loadStrategy();
  if (!strategy?.enabled) {
    return { examined: 0, eligible: 0, attempted: 0, skipped: 0 };
  }

  const offers = await ports.loadEligibleOffers();
  let eligible = 0;
  let attempted = 0;
  let skipped = 0;

  for (const offer of offers) {
    const decision = evaluateAutoApplyDecision({
      ...strategy.decision,
      enabled: true,
      offer,
    });
    if (!decision.eligible) {
      await ports.recordDecision({
        offerUuid: offer.id,
        eligible: false,
        reason: decision.reason,
        operationId: null,
      });
      skipped += 1;
      continue;
    }

    eligible += 1;
    let reservation: AutoApplyReservation | null = null;
    try {
      reservation = await ports.reserve(decision.offerUuid);
      if (!reservation.created || reservation.status !== "RESERVED") {
        await ports.recordDecision({
          offerUuid: decision.offerUuid,
          eligible: true,
          reason: "ALREADY_RESERVED_OR_PROCESSED",
          operationId: reservation.operationId,
        });
        skipped += 1;
        continue;
      }

      await ports.recordDecision({
        offerUuid: decision.offerUuid,
        eligible: true,
        reason: "ELIGIBLE",
        operationId: reservation.operationId,
      });
    } catch {
      if (reservation?.created && reservation.status === "RESERVED") {
        await ports
          .releaseUnclaimed(reservation.operationId)
          .catch(() => undefined);
      }
      skipped += 1;
      continue;
    }

    let claimed = false;
    try {
      claimed = await ports.claim(reservation.operationId);
    } catch {
      skipped += 1;
      continue;
    }
    if (!claimed) {
      skipped += 1;
      continue;
    }

    attempted += 1;
    let outcome: Awaited<ReturnType<AutoApplyExecutionPorts["applyOnce"]>>;
    try {
      outcome = await ports.applyOnce(decision.offerUuid);
    } catch {
      // Toda excepción tras iniciar el POST es ambigua: nunca se reintenta aquí.
      outcome = { status: "AMBIGUOUS", httpStatus: null };
    }
    await ports.recordOutcome(
      reservation.operationId,
      outcome.status,
      outcome.status === "CONFIRMED" ? null : outcome.httpStatus,
    );
  }

  return { examined: offers.length, eligible, attempted, skipped };
}
