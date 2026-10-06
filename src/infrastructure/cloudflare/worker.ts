import type { DurableObjectNamespace, D1Database } from "@cloudflare/workers-types";
import { ScannerSchedulerDurableObject } from "./scanner-scheduler-do.js";
import { authenticate, clearSessionCookie, createUser, getSession, listUsers, logout, requireRole, setUserActive, changeUserPassword, type AppRole } from "./auth-rbac.js";
import { QvaPayAccountClient } from "../qvapay/qvapay-account-client.js";
import { createLoginAppResponse } from "./login-app.js";
import { createPublicAppResponse, createPublicScannerStateResponse, toPublicScannerState } from "./public-app.js";

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
}

const OBJECT_NAME = "default";

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}

async function body(request: Request): Promise<Record<string, unknown>> {
  return (await request.json().catch(() => null)) as Record<string, unknown> | null ?? {};
}

export default {
  async fetch(request: Request, env: ScannerWorkerEnvironment): Promise<Response> {
    const url = new URL(request.url);
    const stub = env.SCANNER_SCHEDULER.getByName(OBJECT_NAME);

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
      const client = new QvaPayAccountClient({
        baseUrl: env.QVAPAY_API_BASE_URL,
        appId: env.QVAPAY_APP_ID,
        appSecret: env.QVAPAY_APP_SECRET,
        userApiToken: env.QVAPAY_USER_API_TOKEN,
      });
      const account = await client.fetchAccount();
      return Response.json({ account }, { headers: { "cache-control": "no-store" } });
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
        const role = typeof input.role === "string" ? input.role as AppRole : "AUDITOR";
        try {
          const user = await createUser(env.DB, username, password, role);
          return Response.json({ user }, { status: 201, headers: { "cache-control": "no-store" } });
        } catch (error) {
          return jsonError(error instanceof Error ? error.message : "No se pudo crear el usuario.", 400);
        }
      }
      const userMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/(enable|disable|password)$/);
      if (userMatch) {
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

export { ScannerSchedulerDurableObject };
