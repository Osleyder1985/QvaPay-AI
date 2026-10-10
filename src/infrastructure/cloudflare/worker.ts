/**
 * @archivo src/infrastructure/cloudflare/worker.ts
 * @proposito Expone el punto de entrada del Worker y enruta las solicitudes.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/infrastructure/cloudflare dentro de la arquitectura de QvaPay-AI.
 */
import type {
  DurableObjectNamespace,
  D1Database,
} from "@cloudflare/workers-types";
import { ScannerSchedulerDurableObject } from "./scanner-scheduler-do.js";
import {
  authenticate,
  createUser,
  deleteUserByUsername,
  ensureSecuritySchema,
  getSession,
  listUsers,
  logout,
  requireRole,
  setUserActive,
  changeUserPassword,
} from "./auth-rbac.js";
import { QvaPayAccountClient } from "../qvapay/qvapay-account-client.js";
import {
  QvaPayAmbiguousOperationError,
  QvaPayP2PClient,
  QvaPayProviderError,
  QvaPayTransientError,
} from "../qvapay/qvapay-p2p-client.js";
import {
  claimP2POperation,
  ensureP2POperationSchema,
  recordP2PApplyOutcome,
  recordP2PDetailOutcome,
  recordP2POperationAudit,
  releaseReservedP2POperation,
  reserveP2POperation,
} from "./p2p-operation-store.js";
import {
  getCurrentQvaPayAccountSnapshot,
  getLastSuccessfulQvaPayAccountSnapshot,
  persistQvaPayAccountSnapshot,
} from "./qvapay-account-snapshot-store.js";
import { createLoginAppResponse } from "./login-app.js";
import { bootstrapInitialAdmin } from "./initial-admin-setup.js";
import {
  createInitialAdminSetupCompletedResponse,
  createInitialAdminSetupResponse,
} from "./initial-admin-setup-app.js";
import {
  createPublicAppResponse,
  createPublicScannerStateResponse,
  toPublicScannerState,
} from "./public-app.js";
export interface ScannerWorkerEnvironment {
  readonly SCANNER_SCHEDULER: DurableObjectNamespace<ScannerSchedulerDurableObject>;
  readonly DB: D1Database;
  readonly QVAPAY_API_BASE_URL: string;
  readonly QVAPAY_APP_ID: string;
  readonly QVAPAY_APP_SECRET: string;
  readonly QVAPAY_USER_API_TOKEN: string;
  readonly SCANNER_COIN: string;
  readonly SCANNER_INTERVAL_SECONDS: string;
  readonly SCANNER_BOOTSTRAP_TOKEN: string;
  readonly PRODUCTION_SMOKE_TOKEN: string;
  readonly ACCOUNT_AUTH_SECRET: string;
}
const OBJECT_NAME = "default";
function jsonError(message: string, status: number): Response {
  return Response.json(
    { error: message },
    { status, headers: { "cache-control": "no-store" } },
  );
}

/**
 * @proposito validateSameOriginMutation: protege las mutaciones autenticadas frente a CSRF.
 * @responsabilidades Exigir un encabezado Origin exacto cuando la solicitud lleva
 * la cookie de sesión.
 * @param request Solicitud HTTP entrante.
 * @param url URL ya normalizada de la solicitud.
 * @returns Respuesta 403 si el origen falta o no coincide; null si la validación
 * no aplica o es válida.
 */
function validateSameOriginMutation(
  request: Request,
  url: URL,
): Response | null {
  if (
    !["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase())
  ) {
    return null;
  }
  const cookie = request.headers.get("cookie") ?? "";
  if (!/(?:^|;\s*)qvapay_ai_session=/.test(cookie)) return null;
  const origin = request.headers.get("origin");
  if (!origin || origin !== url.origin) {
    return jsonError("Origen de solicitud no válido.", 403);
  }
  return null;
}
async function body(request: Request): Promise<Record<string, unknown>> {
  return (
    ((await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null) ?? {}
  );
}
export default {
  async fetch(
    request: Request,
    env: ScannerWorkerEnvironment,
  ): Promise<Response> {
    const url = new URL(request.url);
    const csrfResponse = validateSameOriginMutation(request, url);
    if (csrfResponse) return csrfResponse;
    const stub = env.SCANNER_SCHEDULER.getByName(OBJECT_NAME);

    if (
      url.pathname === "/" ||
      url.pathname.startsWith("/app/") ||
      url.pathname.startsWith("/api/")
    ) {
      await ensureSecuritySchema(env.DB);
    }

    if (url.pathname === "/setup") {
      if (request.method !== "GET")
        return new Response("Method not allowed", { status: 405 });
      const count = await env.DB.prepare(
        "SELECT COUNT(*) AS count FROM app_users",
      ).first<{ count: number }>();
      const nonSmokeCount = await env.DB.prepare(
        "SELECT COUNT(*) AS count FROM app_users WHERE username NOT LIKE 'ci-smoke-%'",
      ).first<{ count: number }>();
      if (
        Number(nonSmokeCount?.count ?? 0) === 0 &&
        Number(count?.count ?? 0) !== 0
      ) {
        await env.DB.prepare(
          "DELETE FROM app_users WHERE username LIKE 'ci-smoke-%'",
        ).run();
      }
      const remaining = await env.DB.prepare(
        "SELECT COUNT(*) AS count FROM app_users",
      ).first<{ count: number }>();
      if (Number(remaining?.count ?? 0) !== 0)
        return createInitialAdminSetupCompletedResponse();
      return createInitialAdminSetupResponse();
    }

    if (url.pathname === "/api/auth/bootstrap") {
      if (request.method !== "POST")
        return new Response("Method not allowed", { status: 405 });
      const input = await body(request);
      const username = typeof input.username === "string" ? input.username : "";
      const password = typeof input.password === "string" ? input.password : "";
      try {
        const user = await bootstrapInitialAdmin(env.DB, username, password);
        return Response.json(
          { created: true, user },
          { status: 201, headers: { "cache-control": "no-store" } },
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No fue posible completar la configuración inicial.";
        const status =
          message === "La configuración inicial ya fue completada." ? 409 : 400;
        return jsonError(message, status);
      }
    }

    if (url.pathname === "/api/auth/login") {
      if (request.method !== "POST")
        return new Response("Method not allowed", { status: 405 });
      const input = await body(request);
      const username = typeof input.username === "string" ? input.username : "";
      const password = typeof input.password === "string" ? input.password : "";
      if (!username || !password)
        return jsonError("Usuario y contraseña son obligatorios.", 400);
      try {
        const result = await authenticate(
          request,
          env.DB,
          env.ACCOUNT_AUTH_SECRET,
          username,
          password,
        );
        if (!result) return jsonError("Credenciales inválidas.", 401);
        return Response.json(
          { authenticated: true, user: result.user, expiresInSeconds: 28800 },
          {
            headers: {
              "cache-control": "no-store",
              "set-cookie": result.sessionCookie,
            },
          },
        );
      } catch (error) {
        return jsonError(
          error instanceof Error
            ? error.message
            : "No fue posible iniciar sesión.",
          400,
        );
      }
    }

    if (url.pathname === "/internal/auth/smoke-user") {
      const authorization = request.headers.get("authorization");
      if (authorization !== `Bearer ${env.PRODUCTION_SMOKE_TOKEN}`)
        return new Response("Unauthorized", { status: 401 });
      const input = await body(request);
      const username =
        typeof input.username === "string" ? input.username.trim() : "";
      if (!/^ci-smoke-[a-zA-Z0-9-]{3,64}$/.test(username))
        return jsonError("Smoke username inválido.", 400);

      if (request.method === "POST") {
        const password =
          typeof input.password === "string" ? input.password : "";
        try {
          const user = await createUser(
            env.DB,
            username,
            password,
            "ADMINISTRATION",
          );
          await env.DB.prepare(
            "INSERT INTO security_audit_log (id, occurred_at, actor_user_id, actor_username, event_type, outcome, target_user_id, target_username, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          )
            .bind(
              crypto.randomUUID(),
              new Date().toISOString(),
              null,
              null,
              "smoke_user_created",
              "SUCCESS",
              user.id,
              user.username,
              JSON.stringify({ purpose: "production_auth_smoke" }),
            )
            .run();
          return Response.json(
            { user },
            { headers: { "cache-control": "no-store" } },
          );
        } catch (error) {
          return jsonError(
            error instanceof Error
              ? error.message
              : "No se pudo crear la cuenta de smoke.",
            400,
          );
        }
      }

      if (request.method === "DELETE") {
        try {
          await deleteUserByUsername(env.DB, username);
          return new Response(null, {
            status: 204,
            headers: { "cache-control": "no-store" },
          });
        } catch (error) {
          return jsonError(
            error instanceof Error
              ? error.message
              : "No se pudo eliminar la cuenta de smoke.",
            400,
          );
        }
      }

      return new Response("Method not allowed", { status: 405 });
    }

    if (url.pathname === "/api/auth/logout") {
      if (request.method !== "POST")
        return new Response("Method not allowed", { status: 405 });
      return logout(request, env.DB, env.ACCOUNT_AUTH_SECRET);
    }

    const moduleRoute = url.pathname.match(/^\/app\/([a-z-]+)$/);
    if (moduleRoute) {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
      }
      const moduleId = moduleRoute[1] ?? "";
      const allowedModules = [
        "inicio",
        "cuenta",
        "mercado",
        "arbitraje",
        "operaciones",
        "usuarios",
        "seguridad",
        "monitor",
        "configuracion",
      ];
      if (!allowedModules.includes(moduleId)) {
        return new Response("Módulo no encontrado.", { status: 404 });
      }
      const session = await getSession(
        request,
        env.DB,
        env.ACCOUNT_AUTH_SECRET,
      );
      if (!session) return createLoginAppResponse();
      if (moduleId === "usuarios" && session.user.role !== "ADMINISTRATION") {
        return new Response("Acceso denegado.", {
          status: 403,
          headers: { "cache-control": "no-store" },
        });
      }
      return createPublicAppResponse(moduleId);
    }

    if (url.pathname === "/") {
      if (request.method !== "GET")
        return new Response("Method not allowed", { status: 405 });
      const session = await getSession(
        request,
        env.DB,
        env.ACCOUNT_AUTH_SECRET,
      );
      return session ? createPublicAppResponse() : createLoginAppResponse();
    }

    if (url.pathname === "/api/session") {
      if (request.method !== "GET")
        return new Response("Method not allowed", { status: 405 });
      const session = await getSession(
        request,
        env.DB,
        env.ACCOUNT_AUTH_SECRET,
      );
      if (!session) return jsonError("Autenticación requerida.", 401);
      return Response.json(
        { authenticated: true, user: session.user },
        { headers: { "cache-control": "no-store" } },
      );
    }

    if (url.pathname === "/api/account/snapshot") {
      if (request.method !== "GET")
        return new Response("Method not allowed", { status: 405 });
      const access = await requireRole(
        request,
        env.DB,
        env.ACCOUNT_AUTH_SECRET,
        ["ADMINISTRATION", "AUDITOR"],
      );
      if (access instanceof Response) return access;
      const [current, lastSuccessful] = await Promise.all([
        getCurrentQvaPayAccountSnapshot(env.DB),
        getLastSuccessfulQvaPayAccountSnapshot(env.DB),
      ]);
      return Response.json(
        { current, lastSuccessful },
        { headers: { "cache-control": "no-store" } },
      );
    }

    if (url.pathname === "/api/account/password") {
      if (request.method !== "POST")
        return new Response("Method not allowed", { status: 405 });
      const access = await requireRole(
        request,
        env.DB,
        env.ACCOUNT_AUTH_SECRET,
        ["ADMINISTRATION", "AUDITOR"],
      );
      if (access instanceof Response) return access;
      const input = await body(request);
      const password = typeof input.password === "string" ? input.password : "";
      const confirmation =
        typeof input.confirmation === "string" ? input.confirmation : "";
      if (password !== confirmation)
        return jsonError("Las contraseñas no coinciden.", 400);
      try {
        const user = await changeUserPassword(
          env.DB,
          access.user,
          access.user.id,
          password,
        );
        return Response.json(
          { user },
          { headers: { "cache-control": "no-store" } },
        );
      } catch (error) {
        return jsonError(
          error instanceof Error
            ? error.message
            : "No se pudo cambiar la contraseña.",
          400,
        );
      }
    }

    if (url.pathname === "/api/account") {
      if (request.method !== "GET")
        return new Response("Method not allowed", { status: 405 });
      const access = await requireRole(
        request,
        env.DB,
        env.ACCOUNT_AUTH_SECRET,
        ["ADMINISTRATION", "AUDITOR"],
      );
      if (access instanceof Response) return access;
      const current = await getCurrentQvaPayAccountSnapshot(env.DB);
      const lastSuccessful = await getLastSuccessfulQvaPayAccountSnapshot(
        env.DB,
      );
      return Response.json(
        {
          account: current?.snapshot ?? lastSuccessful?.snapshot ?? null,
          snapshot: current ?? lastSuccessful ?? null,
        },
        { headers: { "cache-control": "no-store" } },
      );
    }

    if (url.pathname === "/api/account/sync") {
      if (request.method !== "POST")
        return new Response("Method not allowed", { status: 405 });
      const access = await requireRole(
        request,
        env.DB,
        env.ACCOUNT_AUTH_SECRET,
        ["ADMINISTRATION"],
      );
      if (access instanceof Response) return access;
      try {
        const client = new QvaPayAccountClient({
          baseUrl: env.QVAPAY_API_BASE_URL,
          appId: env.QVAPAY_APP_ID,
          appSecret: env.QVAPAY_APP_SECRET,
          userApiToken: env.QVAPAY_USER_API_TOKEN,
        });
        const account = await client.fetchAccount();
        const persisted = await persistQvaPayAccountSnapshot(env.DB, account);
        await env.DB.prepare(
          "INSERT INTO security_audit_log (id, occurred_at, actor_user_id, actor_username, event_type, outcome, target_user_id, target_username, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
          .bind(
            crypto.randomUUID(),
            new Date().toISOString(),
            access.user.id,
            access.user.username,
            "qvapay_account_sync",
            "SUCCESS",
            null,
            null,
            JSON.stringify({
              snapshotId: persisted.id,
              integrationStatus: persisted.integrationStatus,
            }),
          )
          .run();
        return Response.json(
          { account, snapshot: persisted },
          { headers: { "cache-control": "no-store" } },
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "QvaPay account synchronization failed.";
        return jsonError(message, 502);
      }
    }

    if (url.pathname === "/api/scanner/status") {
      if (request.method !== "GET")
        return new Response("Method not allowed", { status: 405 });
      const access = await requireRole(
        request,
        env.DB,
        env.ACCOUNT_AUTH_SECRET,
        ["ADMINISTRATION", "AUDITOR"],
      );
      if (access instanceof Response) return access;
      return createPublicScannerStateResponse(
        toPublicScannerState(await stub.getState()),
      );
    }

    const applyMatch = url.pathname.match(/^\/api\/p2p\/([^/]+)\/apply$/);
    if (applyMatch) {
      if (request.method !== "POST") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { allow: "POST", "cache-control": "no-store" },
        });
      }
      const access = await requireRole(
        request,
        env.DB,
        env.ACCOUNT_AUTH_SECRET,
        ["ADMINISTRATION"],
      );
      if (access instanceof Response) return access;

      let offerUuid = "";
      try {
        offerUuid = decodeURIComponent(applyMatch[1] ?? "").trim();
      } catch {
        return jsonError("El identificador de oferta no es válido.", 400);
      }
      if (!offerUuid || offerUuid.length > 200) {
        return jsonError("El identificador de oferta no es válido.", 400);
      }
      if (!env.QVAPAY_USER_API_TOKEN) {
        return jsonError(
          "La reconciliación segura de la cuenta QvaPay no está configurada.",
          503,
        );
      }

      let accountSnapshot;
      try {
        const accountClient = new QvaPayAccountClient({
          baseUrl: env.QVAPAY_API_BASE_URL,
          appId: env.QVAPAY_APP_ID,
          appSecret: env.QVAPAY_APP_SECRET,
          userApiToken: env.QVAPAY_USER_API_TOKEN,
        });
        accountSnapshot = await accountClient.fetchAccount();
        await persistQvaPayAccountSnapshot(env.DB, accountSnapshot);
      } catch {
        return jsonError(
          "No se pudo verificar en tiempo real la cuenta QvaPay; no se envió ninguna aplicación.",
          503,
        );
      }
      const identity = accountSnapshot.identity;
      if (
        accountSnapshot.integrationStatus !== "verified" ||
        !accountSnapshot.ownerCorrelationOk ||
        !identity ||
        !identity.p2pEnabled ||
        identity.kyc !== true ||
        identity.phoneVerified !== true ||
        identity.telegramVerified !== true
      ) {
        return jsonError(
          "La cuenta QvaPay no tiene una identidad y elegibilidad P2P verificadas. Sincroniza la cuenta antes de operar.",
          403,
        );
      }

      const client = new QvaPayP2PClient({
        baseUrl: env.QVAPAY_API_BASE_URL,
        appId: env.QVAPAY_APP_ID,
        appSecret: env.QVAPAY_APP_SECRET,
        userApiToken: env.QVAPAY_USER_API_TOKEN,
      });

      let reservation;
      try {
        await ensureP2POperationSchema(env.DB);
        reservation = await reserveP2POperation(env.DB, {
          offerUuid,
          source: "MANUAL",
          actorUserId: access.user.id,
          actorUsername: access.user.username,
        });
      } catch {
        return jsonError("No se pudo reservar la operación P2P.", 503);
      }

      // Una aplicación confirmada puede dejar la oferta remota en "processing".
      // La recuperación del detalle debe preceder a las validaciones para nuevas aplicaciones.
      if (
        reservation.operation.applyStatus === "CONFIRMED" &&
        ["PENDING", "FAILED"].includes(reservation.operation.detailStatus)
      ) {
        try {
          const detail = await client.fetchOfferDetail(offerUuid);
          await recordP2PDetailOutcome(env.DB, reservation.operation.id, {
            available: true,
          });
          return Response.json(
            {
              operationId: reservation.operation.id,
              applyStatus: "CONFIRMED",
              detailStatus: "AVAILABLE",
              offer: detail,
              alreadyApplied: true,
            },
            { status: 200, headers: { "cache-control": "no-store" } },
          );
        } catch {
          return Response.json(
            {
              operationId: reservation.operation.id,
              applyStatus: "CONFIRMED",
              detailStatus: reservation.operation.detailStatus,
              message:
                "La aplicación está confirmada; el detalle sigue pendiente de reconciliación.",
              alreadyApplied: true,
            },
            { status: 202, headers: { "cache-control": "no-store" } },
          );
        }
      }
      if (!reservation.created) {
        return Response.json(
          {
            operationId: reservation.operation.id,
            applyStatus: reservation.operation.applyStatus,
            detailStatus: reservation.operation.detailStatus,
            message:
              "Esta oferta ya tiene una reserva creada por otra solicitud; no se enviará otra aplicación.",
          },
          { status: 409, headers: { "cache-control": "no-store" } },
        );
      }

      const rejectReservedOperation = async (
        message: string,
        status: number,
      ): Promise<Response> => {
        try {
          const released = await releaseReservedP2POperation(
            env.DB,
            reservation.operation.id,
          );
          if (!released) {
            return jsonError(
              "No se pudo confirmar la liberación de la reserva P2P; requiere revisión operativa.",
              503,
            );
          }
        } catch {
          return jsonError(
            "No se pudo liberar de forma segura la reserva P2P; requiere revisión operativa.",
            503,
          );
        }
        return jsonError(message, status);
      };

      const runtimeState = await stub.getState();
      const market = runtimeState.market;
      const offer = market?.offers.find(
        (candidate) => candidate.id === offerUuid,
      );
      const nowMs = Date.now();
      const observedAtMs = offer ? Date.parse(offer.observedAt) : Number.NaN;
      const maxAgeMs =
        Math.max(1, Number(env.SCANNER_INTERVAL_SECONDS) || 10) * 2000;
      if (
        runtimeState.execution.lastError ||
        !offer ||
        offer.status !== "open" ||
        !Number.isFinite(observedAtMs) ||
        nowMs - observedAtMs > maxAgeMs ||
        offer.market !== env.SCANNER_COIN
      ) {
        return rejectReservedOperation(
          "La oferta no pertenece a un snapshot fresco y accionable. Actualiza el mercado y vuelve a comprobarla.",
          409,
        );
      }
      if (offer.onlyVip && identity.vip !== true) {
        return rejectReservedOperation(
          "La oferta requiere elegibilidad VIP.",
          403,
        );
      }

      let preflightDetail: Awaited<
        ReturnType<QvaPayP2PClient["fetchOfferDetail"]>
      >;
      try {
        preflightDetail = await client.fetchOfferDetail(offerUuid);
      } catch (error) {
        if (error instanceof QvaPayProviderError && error.status === 401) {
          return rejectReservedOperation(
            "La credencial server-side de cuenta QvaPay no pudo autenticarse.",
            503,
          );
        }
        return rejectReservedOperation(
          "No se pudo verificar el detalle autoritativo de la oferta; no se envió ninguna aplicación.",
          409,
        );
      }
      if (
        preflightDetail.status !== "open" ||
        preflightDetail.ownerUuid === null ||
        preflightDetail.ownerUuid === identity.uuid ||
        preflightDetail.coin !== env.SCANNER_COIN ||
        (preflightDetail.side === "sell" ? "SELL" : "BUY") !== offer.side ||
        (preflightDetail.onlyVip === true && identity.vip !== true) ||
        (preflightDetail.onlyKyc === true && identity.kyc !== true)
      ) {
        const reason =
          preflightDetail.ownerUuid === identity.uuid
            ? "No se puede aplicar una oferta propia."
            : preflightDetail.status !== "open"
              ? "La oferta ya no está abierta en QvaPay."
              : preflightDetail.ownerUuid === null
                ? "QvaPay no permitió verificar el propietario de la oferta."
                : "El mercado, tipo o requisito de elegibilidad cambió en QvaPay.";
        return rejectReservedOperation(reason, 409);
      }

      try {
        await recordP2POperationAudit(env.DB, {
          actorUserId: access.user.id,
          actorUsername: access.user.username,
          operationId: reservation.operation.id,
          offerUuid,
          eventType: "p2p_apply_attempt",
          outcome: "SUCCESS",
          applyStatus: "RESERVED",
          detailStatus: "NOT_REQUESTED",
        });
      } catch {
        await releaseReservedP2POperation(env.DB, reservation.operation.id);
        return jsonError(
          "No se pudo registrar la auditoría; la aplicación no se envió.",
          503,
        );
      }

      const claimed = await claimP2POperation(env.DB, reservation.operation.id);
      if (!claimed) {
        return jsonError(
          "La oferta ya está siendo procesada por otra solicitud.",
          409,
        );
      }

      try {
        await client.applyOffer(offerUuid);
      } catch (error) {
        if (error instanceof QvaPayProviderError) {
          await recordP2PApplyOutcome(
            env.DB,
            reservation.operation.id,
            "REJECTED",
            error.status,
          );
          try {
            await recordP2POperationAudit(env.DB, {
              actorUserId: access.user.id,
              actorUsername: access.user.username,
              operationId: reservation.operation.id,
              offerUuid,
              eventType: "p2p_apply_result",
              outcome: "FAILURE",
              applyStatus: "REJECTED",
              detailStatus: "NOT_REQUESTED",
            });
          } catch {
            return jsonError(
              "QvaPay rechazó la aplicación y el resultado quedó guardado; verifica la bitácora antes de otra operación.",
              503,
            );
          }
          const status = [400, 401, 403, 404, 409, 429].includes(error.status)
            ? error.status
            : 502;
          return jsonError(
            status === 409
              ? "QvaPay ya no permite aplicar esta oferta."
              : status === 429
                ? "QvaPay limitó temporalmente las aplicaciones. No se repetirá la solicitud."
                : status === 401 || status === 403
                  ? "QvaPay rechazó la autorización de la operación."
                  : "QvaPay rechazó la aplicación de la oferta.",
            status,
          );
        }
        await recordP2PApplyOutcome(
          env.DB,
          reservation.operation.id,
          "AMBIGUOUS",
          null,
        );
        try {
          await recordP2POperationAudit(env.DB, {
            actorUserId: access.user.id,
            actorUsername: access.user.username,
            operationId: reservation.operation.id,
            offerUuid,
            eventType: "p2p_apply_result",
            outcome: "FAILURE",
            applyStatus: "AMBIGUOUS",
            detailStatus: "NOT_REQUESTED",
          });
        } catch {
          // La operación queda bloqueada por su estado persistente AMBIGUOUS.
        }
        if (
          error instanceof QvaPayAmbiguousOperationError ||
          error instanceof QvaPayTransientError
        ) {
          return Response.json(
            {
              operationId: reservation.operation.id,
              applyStatus: "AMBIGUOUS",
              detailStatus: "NOT_REQUESTED",
              message:
                "No se pudo confirmar el resultado remoto. La oferta queda bloqueada hasta reconciliarla; no reintentes la aplicación.",
            },
            { status: 202, headers: { "cache-control": "no-store" } },
          );
        }
        return Response.json(
          {
            operationId: reservation.operation.id,
            applyStatus: "AMBIGUOUS",
            detailStatus: "NOT_REQUESTED",
            message:
              "El resultado de QvaPay es ambiguo y requiere reconciliación.",
          },
          { status: 202, headers: { "cache-control": "no-store" } },
        );
      }

      await recordP2PApplyOutcome(
        env.DB,
        reservation.operation.id,
        "CONFIRMED",
        null,
      );
      let auditStatus: "RECORDED" | "FAILED" = "RECORDED";
      try {
        await recordP2POperationAudit(env.DB, {
          actorUserId: access.user.id,
          actorUsername: access.user.username,
          operationId: reservation.operation.id,
          offerUuid,
          eventType: "p2p_apply_result",
          outcome: "SUCCESS",
          applyStatus: "CONFIRMED",
          detailStatus: "PENDING",
        });
      } catch {
        auditStatus = "FAILED";
      }
      try {
        const detail = await client.fetchOfferDetail(offerUuid);
        await recordP2PDetailOutcome(env.DB, reservation.operation.id, {
          available: true,
        });
        try {
          await recordP2POperationAudit(env.DB, {
            actorUserId: access.user.id,
            actorUsername: access.user.username,
            operationId: reservation.operation.id,
            offerUuid,
            eventType: "p2p_apply_detail",
            outcome: "SUCCESS",
            applyStatus: "CONFIRMED",
            detailStatus: "AVAILABLE",
          });
        } catch {
          auditStatus = "FAILED";
        }
        return Response.json(
          {
            operationId: reservation.operation.id,
            applyStatus: "CONFIRMED",
            detailStatus: "AVAILABLE",
            auditStatus,
            offer: detail,
          },
          { status: 201, headers: { "cache-control": "no-store" } },
        );
      } catch (error) {
        const errorCode =
          error instanceof QvaPayTransientError &&
          /tiempo de espera/i.test(error.message)
            ? "TIMEOUT"
            : error instanceof QvaPayTransientError
              ? "UNAVAILABLE"
              : error instanceof QvaPayProviderError && error.status >= 500
                ? "HTTP_5XX"
                : "CONTRACT";
        await recordP2PDetailOutcome(env.DB, reservation.operation.id, {
          available: false,
          errorCode,
        });
        try {
          await recordP2POperationAudit(env.DB, {
            actorUserId: access.user.id,
            actorUsername: access.user.username,
            operationId: reservation.operation.id,
            offerUuid,
            eventType: "p2p_apply_detail",
            outcome: "FAILURE",
            applyStatus: "CONFIRMED",
            detailStatus: "FAILED",
          });
        } catch {
          auditStatus = "FAILED";
        }
        return Response.json(
          {
            operationId: reservation.operation.id,
            applyStatus: "CONFIRMED",
            detailStatus: "FAILED",
            auditStatus,
            message:
              "QvaPay confirmó la aplicación, pero el detalle no está disponible. La aplicación no se repetirá.",
          },
          { status: 201, headers: { "cache-control": "no-store" } },
        );
      }
    }

    if (url.pathname.startsWith("/api/admin/")) {
      const access = await requireRole(
        request,
        env.DB,
        env.ACCOUNT_AUTH_SECRET,
        ["ADMINISTRATION"],
      );
      if (access instanceof Response) return access;
      if (url.pathname === "/api/admin/users" && request.method === "GET") {
        return Response.json(
          { users: await listUsers(env.DB) },
          { headers: { "cache-control": "no-store" } },
        );
      }
      if (url.pathname === "/api/admin/users" && request.method === "POST") {
        const input = await body(request);
        const username =
          typeof input.username === "string" ? input.username : "";
        const password =
          typeof input.password === "string" ? input.password : "";
        const requestedRole =
          typeof input.role === "string" ? input.role : "AUDITOR";
        if (requestedRole !== "AUDITOR") {
          return jsonError(
            "Solo se pueden crear usuarios con rol Observador.",
            400,
          );
        }
        try {
          const user = await createUser(env.DB, username, password, "AUDITOR");
          return Response.json(
            { user },
            { status: 201, headers: { "cache-control": "no-store" } },
          );
        } catch (error) {
          return jsonError(
            error instanceof Error
              ? error.message
              : "No se pudo crear el usuario.",
            400,
          );
        }
      }
      const userMatch = url.pathname.match(
        /^\/api\/admin\/users\/([^/]+)\/(enable|disable|password)$/,
      );
      if (userMatch) {
        const userId = userMatch[1];
        if (!userId) return jsonError("Usuario no encontrado.", 404);
        const input = await body(request);
        try {
          const session = access;
          if (userMatch[2] === "enable" || userMatch[2] === "disable") {
            if (request.method !== "POST")
              return new Response("Method not allowed", { status: 405 });
            const user = await setUserActive(
              env.DB,
              session.user,
              userId,
              userMatch[2] === "enable",
            );
            return Response.json(
              { user },
              { headers: { "cache-control": "no-store" } },
            );
          }
          if (request.method !== "POST")
            return new Response("Method not allowed", { status: 405 });
          const password =
            typeof input.password === "string" ? input.password : "";
          const user = await changeUserPassword(
            env.DB,
            session.user,
            userId,
            password,
          );
          return Response.json(
            { user },
            { headers: { "cache-control": "no-store" } },
          );
        } catch (error) {
          return jsonError(
            error instanceof Error
              ? error.message
              : "No se pudo actualizar el usuario.",
            400,
          );
        }
      }
      return jsonError("Ruta administrativa no encontrada.", 404);
    }

    if (
      url.pathname !== "/internal/scanner/start" &&
      url.pathname !== "/internal/scanner/state"
    ) {
      if (url.pathname.startsWith("/api/"))
        return jsonError("Autenticación requerida.", 401);
      return new Response("Not found", { status: 404 });
    }

    if (request.method !== "POST" && request.method !== "GET")
      return new Response("Method not allowed", { status: 405 });
    const authorization = request.headers.get("authorization");
    if (authorization !== `Bearer ${env.SCANNER_BOOTSTRAP_TOKEN}`)
      return new Response("Unauthorized", { status: 401 });

    if (url.pathname === "/internal/scanner/state") {
      if (request.method !== "GET")
        return new Response("Method not allowed", { status: 405 });
      return Response.json(await stub.getState());
    }

    if (request.method !== "POST")
      return new Response("Method not allowed", { status: 405 });
    const state = await stub.ensureScheduled({
      coin: env.SCANNER_COIN,
      intervalSeconds: Number(env.SCANNER_INTERVAL_SECONDS),
    });
    return Response.json(state);
  },
};
export { ScannerSchedulerDurableObject };
