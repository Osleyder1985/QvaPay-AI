/**
 * @archivo src/infrastructure/cloudflare/worker.ts
 * @proposito Expone el punto de entrada del Worker y enruta las solicitudes.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/infrastructure/cloudflare dentro de la arquitectura de QvaPay-AI.
 */

// prettier-ignore
import type { DurableObjectNamespace, D1Database } from "@cloudflare/workers-types";
// prettier-ignore
import { ScannerSchedulerDurableObject } from "./scanner-scheduler-do.js";
// prettier-ignore
import { authenticate, createUser, deleteUserByUsername, ensureSecuritySchema, getSession, listUsers, logout, requireRole, setUserActive, changeUserPassword } from "./auth-rbac.js";
// prettier-ignore
import { QvaPayAccountClient } from "../qvapay/qvapay-account-client.js";
import {
  getCurrentQvaPayAccountSnapshot,
  getLastSuccessfulQvaPayAccountSnapshot,
  persistQvaPayAccountSnapshot,
} from "./qvapay-account-snapshot-store.js";
// prettier-ignore
import { createLoginAppResponse } from "./login-app.js";
// prettier-ignore
import { bootstrapInitialAdmin } from "./initial-admin-setup.js";
// prettier-ignore
import { createInitialAdminSetupCompletedResponse, createInitialAdminSetupResponse } from "./initial-admin-setup-app.js";
// prettier-ignore
import { createPublicAppResponse, createPublicScannerStateResponse, toPublicScannerState } from "./public-app.js";

// prettier-ignore
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

// prettier-ignore
const OBJECT_NAME = "default";

// prettier-ignore
function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
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

// prettier-ignore
async function body(request: Request): Promise<Record<string, unknown>> {
  return (await request.json().catch(() => null)) as Record<string, unknown> | null ?? {};
}

// prettier-ignore
export default {
  async fetch(request: Request, env: ScannerWorkerEnvironment): Promise<Response> {
    const url = new URL(request.url);
    const csrfResponse = validateSameOriginMutation(request, url);
    if (csrfResponse) return csrfResponse;
    const stub = env.SCANNER_SCHEDULER.getByName(OBJECT_NAME);

    if (url.pathname === "/" || url.pathname.startsWith("/app/") || url.pathname.startsWith("/api/")) {
      await ensureSecuritySchema(env.DB);
    }

    if (url.pathname === "/setup") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM app_users").first<{ count: number }>();
      const nonSmokeCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM app_users WHERE username NOT LIKE 'ci-smoke-%'").first<{ count: number }>();
      if (Number(nonSmokeCount?.count ?? 0) === 0 && Number(count?.count ?? 0) !== 0) {
        await env.DB.prepare("DELETE FROM app_users WHERE username LIKE 'ci-smoke-%'").run();
      }
      const remaining = await env.DB.prepare("SELECT COUNT(*) AS count FROM app_users").first<{ count: number }>();
      if (Number(remaining?.count ?? 0) !== 0) return createInitialAdminSetupCompletedResponse();
      return createInitialAdminSetupResponse();
    }

    if (url.pathname === "/api/auth/bootstrap") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      const input = await body(request);
      const username = typeof input.username === "string" ? input.username : "";
      const password = typeof input.password === "string" ? input.password : "";
      try {
        const user = await bootstrapInitialAdmin(
          env.DB,
          username,
          password,
        );
        return Response.json(
          { created: true, user },
          { status: 201, headers: { "cache-control": "no-store" } },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "No fue posible completar la configuración inicial.";
        const status = message === "La configuración inicial ya fue completada." ? 409 : 400;
        return jsonError(message, status);
      }
    }

    if (url.pathname === "/api/auth/login") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      const input = await body(request);
      const username = typeof input.username === "string" ? input.username : "";
      const password = typeof input.password === "string" ? input.password : "";
      if (!username || !password) return jsonError("Usuario y contraseña son obligatorios.", 400);
      try {
        const result = await authenticate(request, env.DB, env.ACCOUNT_AUTH_SECRET, username, password);
        if (!result) return jsonError("Credenciales inválidas.", 401);
        return Response.json(
          { authenticated: true, user: result.user, expiresInSeconds: 28800 },
          { headers: { "cache-control": "no-store", "set-cookie": result.sessionCookie } },
        );
      } catch (error) {
        return jsonError(error instanceof Error ? error.message : "No fue posible iniciar sesión.", 400);
      }
    }

    if (url.pathname === "/internal/auth/smoke-user") {
      const authorization = request.headers.get("authorization");
      if (authorization !== `Bearer ${env.PRODUCTION_SMOKE_TOKEN}`) return new Response("Unauthorized", { status: 401 });
      const input = await body(request);
      const username = typeof input.username === "string" ? input.username.trim() : "";
      if (!/^ci-smoke-[a-zA-Z0-9-]{3,64}$/.test(username)) return jsonError("Smoke username inválido.", 400);

      if (request.method === "POST") {
        const password = typeof input.password === "string" ? input.password : "";
        try {
          const user = await createUser(env.DB, username, password, "ADMINISTRATION");
          await env.DB.prepare(
            "INSERT INTO security_audit_log (id, occurred_at, actor_user_id, actor_username, event_type, outcome, target_user_id, target_username, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ).bind(crypto.randomUUID(), new Date().toISOString(), null, null, "smoke_user_created", "SUCCESS", user.id, user.username, JSON.stringify({ purpose: "production_auth_smoke" })).run();
          return Response.json({ user }, { headers: { "cache-control": "no-store" } });
        } catch (error) {
          return jsonError(error instanceof Error ? error.message : "No se pudo crear la cuenta de smoke.", 400);
        }
      }

      if (request.method === "DELETE") {
        try {
          await deleteUserByUsername(env.DB, username);
          return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
        } catch (error) {
          return jsonError(error instanceof Error ? error.message : "No se pudo eliminar la cuenta de smoke.", 400);
        }
      }

      return new Response("Method not allowed", { status: 405 });
    }

    if (url.pathname === "/api/auth/logout") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
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
      if (
        moduleId === "usuarios" &&
        session.user.role !== "ADMINISTRATION"
      ) {
        return new Response("Acceso denegado.", {
          status: 403,
          headers: { "cache-control": "no-store" },
        });
      }
      return createPublicAppResponse(moduleId);
    }

    if (url.pathname === "/") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      const session = await getSession(request, env.DB, env.ACCOUNT_AUTH_SECRET);
      return session ? createPublicAppResponse() : createLoginAppResponse();
    }

    if (url.pathname === "/api/session") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      const session = await getSession(request, env.DB, env.ACCOUNT_AUTH_SECRET);
      if (!session) return jsonError("Autenticación requerida.", 401);
      return Response.json({ authenticated: true, user: session.user }, { headers: { "cache-control": "no-store" } });
    }

    if (url.pathname === "/api/account/snapshot") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      const access = await requireRole(request, env.DB, env.ACCOUNT_AUTH_SECRET, ["ADMINISTRATION", "AUDITOR"]);
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
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      const access = await requireRole(request, env.DB, env.ACCOUNT_AUTH_SECRET, ["ADMINISTRATION", "AUDITOR"]);
      if (access instanceof Response) return access;
      const input = await body(request);
      const password = typeof input.password === "string" ? input.password : "";
      const confirmation = typeof input.confirmation === "string" ? input.confirmation : "";
      if (password !== confirmation) return jsonError("Las contraseñas no coinciden.", 400);
      try {
        const user = await changeUserPassword(env.DB, access.user, access.user.id, password);
        return Response.json({ user }, { headers: { "cache-control": "no-store" } });
      } catch (error) {
        return jsonError(error instanceof Error ? error.message : "No se pudo cambiar la contraseña.", 400);
      }
    }

    if (url.pathname === "/api/account") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      const access = await requireRole(request, env.DB, env.ACCOUNT_AUTH_SECRET, ["ADMINISTRATION", "AUDITOR"]);
      if (access instanceof Response) return access;
      const current = await getCurrentQvaPayAccountSnapshot(env.DB);
      const lastSuccessful = await getLastSuccessfulQvaPayAccountSnapshot(env.DB);
      return Response.json(
        {
          account: current?.snapshot ?? lastSuccessful?.snapshot ?? null,
          snapshot: current ?? lastSuccessful ?? null,
        },
        { headers: { "cache-control": "no-store" } },
      );
    }

    if (url.pathname === "/api/account/sync") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      const access = await requireRole(request, env.DB, env.ACCOUNT_AUTH_SECRET, ["ADMINISTRATION"]);
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
        ).bind(
          crypto.randomUUID(),
          new Date().toISOString(),
          access.user.id,
          access.user.username,
          "qvapay_account_sync",
          "SUCCESS",
          null,
          null,
          JSON.stringify({ snapshotId: persisted.id, integrationStatus: persisted.integrationStatus }),
        ).run();
        return Response.json(
          { account, snapshot: persisted },
          { headers: { "cache-control": "no-store" } },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "QvaPay account synchronization failed.";
        return jsonError(message, 502);
      }
    }

    if (url.pathname === "/api/scanner/status") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      const access = await requireRole(request, env.DB, env.ACCOUNT_AUTH_SECRET, ["ADMINISTRATION", "AUDITOR"]);
      if (access instanceof Response) return access;
      return createPublicScannerStateResponse(toPublicScannerState(await stub.getState()));
    }

    const applyMatch = url.pathname.match(/^\/api\/p2p\/([^/]+)\/apply$/);
    if (applyMatch) {
      const access = await requireRole(request, env.DB, env.ACCOUNT_AUTH_SECRET, ["ADMINISTRATION"]);
      if (access instanceof Response) return access;
      return jsonError("La operación P2P está protegida y su ejecución seguirá el contrato operativo existente.", 501);
    }

    if (url.pathname.startsWith("/api/admin/")) {
      const access = await requireRole(request, env.DB, env.ACCOUNT_AUTH_SECRET, ["ADMINISTRATION"]);
      if (access instanceof Response) return access;
      if (url.pathname === "/api/admin/users" && request.method === "GET") {
        return Response.json({ users: await listUsers(env.DB) }, { headers: { "cache-control": "no-store" } });
      }
      if (url.pathname === "/api/admin/users" && request.method === "POST") {
        const input = await body(request);
        const username = typeof input.username === "string" ? input.username : "";
        const password = typeof input.password === "string" ? input.password : "";
        const requestedRole = typeof input.role === "string" ? input.role : "AUDITOR";
        if (requestedRole !== "AUDITOR") {
          return jsonError("Solo se pueden crear usuarios con rol Observador.", 400);
        }
        try {
          const user = await createUser(env.DB, username, password, "AUDITOR");
          return Response.json({ user }, { status: 201, headers: { "cache-control": "no-store" } });
        } catch (error) {
          return jsonError(error instanceof Error ? error.message : "No se pudo crear el usuario.", 400);
        }
      }
      const userMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/(enable|disable|password)$/);
      if (userMatch) {
        const userId = userMatch[1];
        if (!userId) return jsonError("Usuario no encontrado.", 404);
        const input = await body(request);
        try {
          const session = access;
          if (userMatch[2] === "enable" || userMatch[2] === "disable") {
            if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
            const user = await setUserActive(env.DB, session.user, userId, userMatch[2] === "enable");
            return Response.json({ user }, { headers: { "cache-control": "no-store" } });
          }
          if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
          const password = typeof input.password === "string" ? input.password : "";
          const user = await changeUserPassword(env.DB, session.user, userId, password);
          return Response.json({ user }, { headers: { "cache-control": "no-store" } });
        } catch (error) {
          return jsonError(error instanceof Error ? error.message : "No se pudo actualizar el usuario.", 400);
        }
      }
      return jsonError("Ruta administrativa no encontrada.", 404);
    }

    if (url.pathname !== "/internal/scanner/start" && url.pathname !== "/internal/scanner/state") {
      if (url.pathname.startsWith("/api/")) return jsonError("Autenticación requerida.", 401);
      return new Response("Not found", { status: 404 });
    }

    if (request.method !== "POST" && request.method !== "GET") return new Response("Method not allowed", { status: 405 });
    const authorization = request.headers.get("authorization");
    if (authorization !== `Bearer ${env.SCANNER_BOOTSTRAP_TOKEN}`) return new Response("Unauthorized", { status: 401 });

    if (url.pathname === "/internal/scanner/state") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      return Response.json(await stub.getState());
    }

    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const state = await stub.ensureScheduled({ coin: env.SCANNER_COIN, intervalSeconds: Number(env.SCANNER_INTERVAL_SECONDS) });
    return Response.json(state);
  },
};

// prettier-ignore
export { ScannerSchedulerDurableObject };
