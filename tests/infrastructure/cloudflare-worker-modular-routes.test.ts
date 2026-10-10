import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  ensureSecuritySchema: vi.fn(),
  getSession: vi.fn(),
  requireRole: vi.fn(),
  changeUserPassword: vi.fn(),
}));

vi.mock("../../src/infrastructure/cloudflare/auth-rbac.js", () => ({
  authenticate: vi.fn(),
  createUser: vi.fn(),
  deleteUserByUsername: vi.fn(),
  ensureSecuritySchema: authMocks.ensureSecuritySchema,
  getSession: authMocks.getSession,
  listUsers: vi.fn(),
  logout: vi.fn(),
  requireRole: authMocks.requireRole,
  setUserActive: vi.fn(),
  changeUserPassword: authMocks.changeUserPassword,
}));

vi.mock("../../src/infrastructure/cloudflare/scanner-scheduler-do.js", () => ({
  ScannerSchedulerDurableObject: class ScannerSchedulerDurableObject {},
}));

import worker from "../../src/infrastructure/cloudflare/worker.js";
import type { ScannerWorkerEnvironment } from "../../src/infrastructure/cloudflare/worker.js";

const auditorSession = {
  user: {
    id: "auditor-1",
    username: "auditor-test",
    role: "AUDITOR" as const,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: null,
  },
};

const administratorSession = {
  user: {
    ...auditorSession.user,
    id: "admin-1",
    username: "admin-test",
    role: "ADMINISTRATION" as const,
  },
};

function createEnvironment(): ScannerWorkerEnvironment {
  return {
    DB: {
      prepare: vi.fn(),
      batch: vi.fn(),
    } as unknown as ScannerWorkerEnvironment["DB"],
    SCANNER_SCHEDULER: {
      getByName: vi.fn(() => ({
        getState: vi.fn(),
        ensureScheduled: vi.fn(),
      })),
    } as unknown as ScannerWorkerEnvironment["SCANNER_SCHEDULER"],
    QVAPAY_API_BASE_URL: "https://api.qvapay.com",
    QVAPAY_APP_ID: "test-app",
    QVAPAY_APP_SECRET: "test-secret",
    QVAPAY_USER_API_TOKEN: "test-user-token",
    SCANNER_COIN: "BANK_CUP",
    SCANNER_INTERVAL_SECONDS: "10",
    SCANNER_BOOTSTRAP_TOKEN: "boot-test",
    PRODUCTION_SMOKE_TOKEN: "test-smoke-token",
    ACCOUNT_AUTH_SECRET: "test-session-secret",
  };
}

async function requestModule(
  path: string,
  env: ScannerWorkerEnvironment,
  method = "GET",
): Promise<Response> {
  return worker.fetch(
    new Request(`https://qvapay-ai.test${path}`, { method }),
    env,
  );
}

describe("Cloudflare Worker: autorización de rutas modulares", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.ensureSecuritySchema.mockResolvedValue(undefined);
    authMocks.getSession.mockResolvedValue(null);
  });

  it("no entrega HTML autenticado cuando falta la sesión", async () => {
    const env = createEnvironment();

    for (const path of ["/app/inicio", "/app/cuenta"]) {
      const response = await requestModule(path, env);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(html).not.toContain('id="coin"');
      expect(html).not.toContain('id="accountBalance"');
      expect(html).toContain("Iniciar sesión");
    }
  });

  it("permite AUDITOR y deniega Usuarios", async () => {
    const env = createEnvironment();
    authMocks.getSession.mockResolvedValue(auditorSession);

    const allowed = await requestModule("/app/cuenta", env);
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get("cache-control")).toBe("no-store");
    expect(await allowed.text()).toContain("Cuenta QvaPay");

    const denied = await requestModule("/app/usuarios", env);
    expect(denied.status).toBe(403);
    expect(denied.headers.get("cache-control")).toBe("no-store");
    expect(await denied.text()).toContain("Acceso denegado");
  });

  it("permite al rol ADMINISTRATION abrir Usuarios", async () => {
    const env = createEnvironment();
    authMocks.getSession.mockResolvedValue(administratorSession);

    const response = await requestModule("/app/usuarios", env);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Usuarios y acceso");
    expect(html).toContain('id="administracion"');
  });

  it("rechaza mutaciones con Origin inválido", async () => {
    const env = createEnvironment();
    const cases = [
      {
        headers: { cookie: "qvapay_ai_session=session-value" },
        label: "sin Origin",
      },
      {
        headers: {
          cookie: "qvapay_ai_session=session-value",
          origin: "https://attacker.example",
        },
        label: "origen cruzado",
      },
      {
        headers: {
          cookie: "qvapay_ai_session=session-value",
          origin: "null",
        },
        label: "origen opaco",
      },
    ];

    for (const testCase of cases) {
      const response = await worker.fetch(
        new Request("https://qvapay-ai.test/api/account/password", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...testCase.headers,
          },
          body: JSON.stringify({
            password: "safe-password",
            confirmation: "safe-password",
          }),
        }),
        env,
      );
      expect(response.status, testCase.label).toBe(403);
      expect(await response.json()).toEqual({
        error: "Origen de solicitud no válido.",
      });
    }

    expect(authMocks.requireRole).not.toHaveBeenCalled();
  });

  it("acepta Origin del mismo origen en mutación", async () => {
    const env = createEnvironment();
    authMocks.requireRole.mockResolvedValue(administratorSession);
    authMocks.changeUserPassword.mockResolvedValue(administratorSession.user);

    const response = await worker.fetch(
      new Request("https://qvapay-ai.test/api/account/password", {
        method: "POST",
        headers: {
          cookie: "qvapay_ai_session=session-value",
          origin: "https://qvapay-ai.test",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          password: "safe-password",
          confirmation: "safe-password",
        }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    expect(authMocks.requireRole).toHaveBeenCalledOnce();
    expect(authMocks.changeUserPassword).toHaveBeenCalledOnce();
  });

  it("rechaza métodos distintos de POST en la ruta de aplicación P2P", async () => {
    const env = createEnvironment();
    const response = await requestModule(
      "/api/p2p/offer-123/apply",
      env,
      "GET",
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    expect(authMocks.requireRole).not.toHaveBeenCalled();
  });

  it("deniega la ruta de aplicación P2P al rol Auditor antes de consultar el proveedor", async () => {
    const env = createEnvironment();
    authMocks.requireRole.mockResolvedValue(
      Response.json({ error: "Permisos insuficientes." }, { status: 403 }),
    );

    const response = await requestModule(
      "/api/p2p/offer-123/apply",
      env,
      "POST",
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Permisos insuficientes.",
    });
    expect(authMocks.requireRole).toHaveBeenCalledOnce();
  });

  it("rechaza rutas desconocidas y métodos no GET", async () => {
    const env = createEnvironment();
    authMocks.getSession.mockResolvedValue(administratorSession);

    expect((await requestModule("/app/no-existe", env)).status).toBe(404);
    expect((await requestModule("/app/inicio", env, "POST")).status).toBe(405);
    expect(authMocks.getSession).not.toHaveBeenCalled();
  });
});
