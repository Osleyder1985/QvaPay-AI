// prettier-ignore
import type { DurableObjectNamespace, D1Database } from "@cloudflare/workers-types";
// prettier-ignore
import { ScannerSchedulerDurableObject } from "./scanner-scheduler-do.js";
// prettier-ignore
import { authenticate, createUser, deleteUserByUsername, ensureSecuritySchema, getSession, listUsers, logout, requireRole, setUserActive, changeUserPassword } from "./auth-rbac.js";
// prettier-ignore
import { QvaPayAccountClient } from "../qvapay/qvapay-account-client.js";
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
  readonly ACCOUNT_AUTH_SECRET: string;
  readonly INITIAL_ADMIN_BOOTSTRAP_TOKEN: string;
}

// prettier-ignore
const OBJECT_NAME = "default";

// prettier-ignore
function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}

// prettier-ignore
async function body(request: Request): Promise<Record<string, unknown>> {
  return (await request.json().catch(() => null)) as Record<string, unknown> | null ?? {};
}

// prettier-ignore
export default {
  async fetch(request: Request, env: ScannerWorkerEnvironment): Promise<Response> {
    const url = new URL(request.url);
    const stub = env.SCANNER_SCHEDULER.getByName(OBJECT_NAME);

    if (url.pathname === "/" || url.pathname.startsWith("/api/")) {
      await ensureSecuritySchema(env.DB);
    }

    if (url.pathname === "/setup") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM app_users").first<{ count: number }>();
      if (Number(count?.count ?? 0) !== 0) return createInitialAdminSetupCompletedResponse();
      return createInitialAdminSetupResponse();
    }

    if (url.pathname === "/api/auth/bootstrap") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      const presentedToken = request.headers.get("x-initial-admin-token") ?? "";
      const input = await body(request);
      const username = typeof input.username === "string" ? input.username : "";
      const password = typeof input.password === "string" ? input.password : "";
      try {
        const user = await bootstrapInitialAdmin(
          env.DB,
          env.INITIAL_ADMIN_BOOTSTRAP_TOKEN,
          presentedToken,
          username,
          password,
        );
        return Response.json(
          { created: true, user },
          { status: 201, headers: { "cache-control": "no-store" } },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "No fue posible completar la configuración inicial.";
        const status = message === "Token de configuración inválido." ? 401 : message === "La configuración inicial ya fue completada." ? 409 : 400;
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
      if (authorization !== `Bearer ${env.SCANNER_BOOTSTRAP_TOKEN}`) return new Response("Unauthorized", { status: 401 });
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

    if (url.pathname === "/api/account") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      const access = await requireRole(request, env.DB, env.ACCOUNT_AUTH_SECRET, ["ADMINISTRATION", "AUDITOR"]);
      if (access instanceof Response) return access;
      try {
        const client = new QvaPayAccountClient({
          baseUrl: env.QVAPAY_API_BASE_URL,
          appId: env.QVAPAY_APP_ID,
          appSecret: env.QVAPAY_APP_SECRET,
          userApiToken: env.QVAPAY_USER_API_TOKEN,
        });
        const account = await client.fetchAccount();
        return Response.json({ account }, { headers: { "cache-control": "no-store" } });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "QvaPay account integration failed.";
        return jsonError(message, 502);
      }
    }

    if (url.pathname === "/api/scanner/status") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      const access = await requireRole(request, env.DB, env.ACCOUNT_AUTH_SECRET, ["ADMINISTRATION", "AUDITOR"]);
      if (access instanceof Response) return access;
      await stub.ensureScheduled({ coin: env.SCANNER_COIN, intervalSeconds: Number(env.SCANNER_INTERVAL_SECONDS) });
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
