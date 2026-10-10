/**
 * @archivo src/infrastructure/cloudflare/p2p-auto-apply-d1-adapter.ts
 * @proposito Adaptar Auto Apply al almacén D1 compartido con las operaciones manuales.
 * @responsabilidades Reservar y reclamar ofertas con las transiciones comunes, registrar decisiones
 * y persistir resultados sin repetir solicitudes ambiguas.
 * @dependencias D1, p2p-operation-store.ts, auth-rbac.ts y cliente P2P de QvaPay.
 * @seguridad La estrategia y las ofertas no se habilitan por defecto; la reserva única de D1
 * es la barrera compartida MANUAL/AUTO_APPLY; no se reintenta un POST ambiguo.
 * @superficie-publica createD1AutoApplyExecutionPorts.
 * @mantenimiento No conectar al scanner hasta disponer de estrategia persistida, identidad/balance
 * verificados y pruebas de carrera con la ruta manual.
 * @ubicacion Infraestructura Cloudflare/D1 del módulo de operaciones P2P.
 */

import type { D1Database } from "@cloudflare/workers-types";
import type { Offer } from "../../domain/offer.js";
import type { QvaPayAccountClient } from "../qvapay/qvapay-account-client.js";
import type { QvaPayP2PClient } from "../qvapay/qvapay-p2p-client.js";
import type {
  AutoApplyExecutionPorts,
  AutoApplyStrategy,
} from "../../application/p2p-auto-apply-executor.js";
import {
  QvaPayAmbiguousOperationError,
  QvaPayProviderError,
} from "../qvapay/qvapay-p2p-client.js";
import {
  claimP2POperation,
  ensureP2POperationSchema,
  recordP2PApplyOutcome,
  releaseReservedP2POperation,
  reserveP2POperation,
} from "./p2p-operation-store.js";
import { ensureSecuritySchema } from "./auth-rbac.js";

export interface AutoApplyProvider {
  applyOffer(offerUuid: string): Promise<unknown>;
  /** Consulta autoritativa del detalle tras una respuesta de aplicación. */
  fetchOfferDetail?(offerUuid: string): Promise<{
    readonly uuid: string;
    readonly status: string;
    readonly peerUuid: string | null;
  }>;
  /** UUID de la cuenta autenticada, obtenido de una fuente server-side verificada. */
  getVerifiedAccountUuid?(): Promise<string | null>;
}

/**
 * @proposito Crear un proveedor Auto Apply con clientes reales de QvaPay.
 * @responsabilidades Reutilizar la API P2P y aceptar la identidad solo cuando el snapshot
 * server-side valida /user, correlación de aplicación y estado de integración verificado.
 * @param p2pClient Cliente P2P con aplicación única y consulta de detalle.
 * @param accountClient Cliente que obtiene y valida el perfil de cuenta QvaPay.
 * @returns Proveedor compatible con los puertos de ejecución de Auto Apply.
 */
export function createQvaPayAutoApplyProvider(
  p2pClient: Pick<QvaPayP2PClient, "applyOffer" | "fetchOfferDetail">,
  accountClient: Pick<QvaPayAccountClient, "fetchAccount">,
): AutoApplyProvider {
  return {
    applyOffer: (offerUuid) => p2pClient.applyOffer(offerUuid),
    fetchOfferDetail: async (offerUuid) => {
      const detail = await p2pClient.fetchOfferDetail(offerUuid);
      return {
        uuid: detail.uuid,
        status: detail.status,
        peerUuid: detail.peerUuid,
      };
    },
    getVerifiedAccountUuid: async () => {
      const snapshot = await accountClient.fetchAccount();
      const uuid = snapshot.identity?.uuid;
      if (
        snapshot.integrationStatus !== "verified" ||
        snapshot.identitySource !== "/user" ||
        snapshot.identityProvenance.status !== "verified" ||
        !snapshot.identityOk ||
        !snapshot.ownerCorrelationOk ||
        typeof uuid !== "string" ||
        uuid.trim() === ""
      ) {
        return null;
      }
      return uuid;
    },
  };
}

export interface D1AutoApplyExecutionOptions {
  readonly db: D1Database;
  readonly provider: AutoApplyProvider;
  /**
   * Debe devolver null cuando no exista estrategia válida y habilitada.
   * La estrategia debe incluir evidencia de cuenta/balance obtenida server-side.
   */
  readonly loadStrategy?: () => Promise<AutoApplyStrategy | null>;
  /** Debe entregar únicamente snapshots de mercado frescos y validados. */
  readonly loadEligibleOffers?: () => Promise<readonly Offer[]>;
  readonly actor?: {
    readonly userId: string;
    readonly username: string;
  } | null;
  readonly now?: () => string;
}

/**
 * @proposito Crear puertos de ejecución respaldados por D1 y el cliente de QvaPay.
 * @responsabilidades Compartir reserva/reclamación con la ruta manual y fallar cerrado
 * si no se inyectan estrategia u ofertas verificadas.
 * @param options Dependencias explícitas de persistencia, estrategia, mercado y proveedor.
 * @returns Puertos consumibles por executeAutoApplyCandidate.
 */
export function createD1AutoApplyExecutionPorts(
  options: D1AutoApplyExecutionOptions,
): AutoApplyExecutionPorts {
  const now = options.now ?? (() => new Date().toISOString());
  const actorUserId = options.actor?.userId ?? null;
  const actorUsername = options.actor?.username ?? null;

  return {
    loadStrategy: options.loadStrategy ?? (async () => null),
    loadEligibleOffers: options.loadEligibleOffers ?? (async () => []),

    async reserve(offerUuid) {
      await ensureP2POperationSchema(options.db);
      const result = await reserveP2POperation(options.db, {
        offerUuid,
        source: "AUTO_APPLY",
        actorUserId,
        actorUsername,
        now: now(),
      });
      return {
        operationId: result.operation.id,
        created: result.created,
        status: result.operation.applyStatus,
      };
    },

    async recordDecision(input) {
      await ensureSecuritySchema(options.db);
      await options.db
        .prepare(
          "INSERT INTO security_audit_log (id, occurred_at, actor_user_id, actor_username, event_type, outcome, target_user_id, target_username, metadata_json) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?)",
        )
        .bind(
          crypto.randomUUID(),
          now(),
          actorUserId,
          actorUsername,
          "auto_apply_decision",
          input.eligible ? "SUCCESS" : "DENIED",
          JSON.stringify({
            source: "AUTO_APPLY",
            offerUuid: input.offerUuid,
            eligible: input.eligible,
            reason: input.reason,
            operationId: input.operationId,
          }),
        )
        .run();
    },

    claim(operationId) {
      return claimP2POperation(options.db, operationId, now());
    },

    async applyOnce(offerUuid) {
      try {
        await options.provider.applyOffer(offerUuid);
      } catch (error) {
        if (error instanceof QvaPayAmbiguousOperationError) {
          return { status: "AMBIGUOUS" as const, httpStatus: null };
        }
        if (error instanceof QvaPayProviderError) {
          if (error.status >= 400 && error.status < 500) {
            return { status: "REJECTED" as const, httpStatus: error.status };
          }
          return { status: "AMBIGUOUS" as const, httpStatus: error.status };
        }
        // Una excepción tras iniciar apply no prueba que QvaPay no haya actuado.
        return { status: "AMBIGUOUS" as const, httpStatus: null };
      }

      // Solo se confirma con detalle autoritativo y UUID de cuenta verificado.
      if (
        !options.provider.fetchOfferDetail ||
        !options.provider.getVerifiedAccountUuid
      ) {
        return { status: "AMBIGUOUS" as const, httpStatus: null };
      }
      try {
        const [detail, verifiedAccountUuid] = await Promise.all([
          options.provider.fetchOfferDetail(offerUuid),
          options.provider.getVerifiedAccountUuid(),
        ]);
        if (
          detail.uuid === offerUuid &&
          detail.status === "processing" &&
          typeof verifiedAccountUuid === "string" &&
          verifiedAccountUuid.trim() !== "" &&
          detail.peerUuid === verifiedAccountUuid
        ) {
          return { status: "CONFIRMED" as const };
        }
      } catch {
        // No se reenvía el POST ni se confirma si falla la reconciliación.
      }
      return { status: "AMBIGUOUS" as const, httpStatus: null };
    },

    async recordOutcome(operationId, status, httpStatus) {
      await ensureP2POperationSchema(options.db);
      const updated = await recordP2PApplyOutcome(
        options.db,
        operationId,
        status,
        httpStatus,
        now(),
      );
      if (!updated) {
        throw new Error(
          "No se pudo persistir el resultado P2P; la operación requiere reconciliación y no debe reenviarse.",
        );
      }
    },

    async releaseUnclaimed(operationId) {
      await releaseReservedP2POperation(options.db, operationId);
    },
  };
}
