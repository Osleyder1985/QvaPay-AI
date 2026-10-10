/**
 * @archivo src/infrastructure/cloudflare/auth-rbac.ts
 * @proposito Define usuarios, roles y autorización de la aplicación.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/infrastructure/cloudflare dentro de la arquitectura de QvaPay-AI.
 */

import type { D1Database } from "@cloudflare/workers-types";

export type AppRole = "ADMINISTRATION" | "AUDITOR";

/** AUDITOR es el valor de compatibilidad persistido; el rol mostrado al usuario es OBSERVER (Observador). */

export interface AppUser {
  readonly id: string;
  readonly username: string;
  readonly role: AppRole;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastLoginAt: string | null;
}

export interface AuthSession {
  readonly user: AppUser;
}

const SESSION_COOKIE = "qvapay_ai_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
function b64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
function unb64(value: string): Uint8Array {
  const normalized =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((value.length + 3) % 4);
  const binary = atob(normalized);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return result === 0;
}
async function derivePasswordHash(
  password: string,
  salt: Uint8Array,
  iterations = PBKDF2_ITERATIONS,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const saltBuffer = new ArrayBuffer(salt.byteLength);
  new Uint8Array(saltBuffer).set(salt);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return new Uint8Array(bits);
}
async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return b64(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)),
    ),
  );
}
function cookieFromRequest(request: Request): string | null {
  return (
    request.headers
      .get("cookie")
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(SESSION_COOKIE + "="))
      ?.slice(SESSION_COOKIE.length + 1) ?? null
  );
}
async function writeAudit(
  db: D1Database,
  eventType: string,
  outcome: "SUCCESS" | "FAILURE" | "DENIED",
  actor?: Pick<AppUser, "id" | "username">,
  target?: Pick<AppUser, "id" | "username">,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO security_audit_log (id, occurred_at, actor_user_id, actor_username, event_type, outcome, target_user_id, target_username, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      crypto.randomUUID(),
      new Date().toISOString(),
      actor?.id ?? null,
      actor?.username ?? null,
      eventType,
      outcome,
      target?.id ?? null,
      target?.username ?? null,
      JSON.stringify(metadata),
    )
    .run();
}
function rowToUser(row: Record<string, unknown>): AppUser {
  return {
    id: String(row.id),
    username: String(row.username),
    role: String(row.role) as AppRole,
    active: Number(row.active) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    lastLoginAt: row.last_login_at ? String(row.last_login_at) : null,
  };
}
// El arranque del runtime es idempotente y mantiene el inicio de producción independiente de
// los permisos de D1 del plano de control de Wrangler. La migración versionada sigue siendo el
// canonical schema artifact for controlled database administration.
let schemaReady: Promise<void> | null = null;
/**
 * @proposito API pública ensureSecuritySchema: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export async function ensureSecuritySchema(db: D1Database): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = db
    .batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        role TEXT NOT NULL CHECK (role IN ('ADMINISTRATION','AUDITOR')),
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        password_iterations INTEGER NOT NULL,
        active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login_at TEXT
      )`),
      db.prepare(
        "CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username)",
      ),
      db.prepare(
        "CREATE INDEX IF NOT EXISTS idx_app_users_active ON app_users(active)",
      ),
      db.prepare(`CREATE TABLE IF NOT EXISTS security_audit_log (
        id TEXT PRIMARY KEY,
        occurred_at TEXT NOT NULL,
        actor_user_id TEXT,
        actor_username TEXT,
        event_type TEXT NOT NULL,
        outcome TEXT NOT NULL CHECK (outcome IN ('SUCCESS','FAILURE','DENIED')),
        target_user_id TEXT,
        target_username TEXT,
        metadata_json TEXT NOT NULL DEFAULT '{}'
      )`),
      db.prepare(
        "CREATE INDEX IF NOT EXISTS idx_security_audit_log_occurred_at ON security_audit_log(occurred_at DESC)",
      ),
      db.prepare(
        "CREATE INDEX IF NOT EXISTS idx_security_audit_log_actor ON security_audit_log(actor_user_id)",
      ),
      db.prepare(`CREATE TABLE IF NOT EXISTS qvapay_account_snapshots (
        id TEXT PRIMARY KEY,
        schema_version INTEGER NOT NULL,
        integration_status TEXT NOT NULL CHECK (integration_status IN ('verified','degraded','failed')),
        captured_at TEXT NOT NULL,
        persisted_at TEXT NOT NULL,
        snapshot_json TEXT NOT NULL,
        is_current INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0,1)),
        is_last_successful INTEGER NOT NULL DEFAULT 0 CHECK (is_last_successful IN (0,1))
      )`),
      db.prepare(
        "CREATE INDEX IF NOT EXISTS idx_qvapay_account_snapshots_captured_at ON qvapay_account_snapshots(captured_at DESC)",
      ),
      db.prepare(
        "CREATE INDEX IF NOT EXISTS idx_qvapay_account_snapshots_current ON qvapay_account_snapshots(is_current, captured_at DESC)",
      ),
      db.prepare(
        "CREATE INDEX IF NOT EXISTS idx_qvapay_account_snapshots_last_successful ON qvapay_account_snapshots(is_last_successful, captured_at DESC)",
      ),
    ])
    .then(() => undefined)
    .catch((error) => {
      schemaReady = null;
      throw error;
    });
  return schemaReady;
}
/**
 * @proposito API pública createPasswordVerifier: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export async function createPasswordVerifier(
  password: string,
): Promise<{ salt: string; hash: string; iterations: number }> {
  if (password.length < 12)
    throw new Error("La contraseña debe tener al menos 12 caracteres.");
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derivePasswordHash(password, salt);
  return { salt: b64(salt), hash: b64(hash), iterations: PBKDF2_ITERATIONS };
}
async function verifyPassword(
  password: string,
  salt: string,
  expected: string,
  iterations: number,
): Promise<boolean> {
  const actual = await derivePasswordHash(password, unb64(salt), iterations);
  return equalBytes(actual, unb64(expected));
}
/**
 * @proposito API pública findUserByUsername: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export async function findUserByUsername(
  db: D1Database,
  username: string,
): Promise<AppUser | null> {
  const row = await db
    .prepare(
      "SELECT id, username, role, active, created_at, updated_at, last_login_at FROM app_users WHERE username = ? COLLATE NOCASE LIMIT 1",
    )
    .bind(username.trim())
    .first<Record<string, unknown>>();
  return row ? rowToUser(row) : null;
}
/**
 * @proposito API pública listUsers: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export async function listUsers(db: D1Database): Promise<AppUser[]> {
  const result = await db
    .prepare(
      "SELECT id, username, role, active, created_at, updated_at, last_login_at FROM app_users ORDER BY username COLLATE NOCASE",
    )
    .all<Record<string, unknown>>();
  return result.results.map(rowToUser);
}
/**
 * @proposito API pública createUser: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export async function createUser(
  db: D1Database,
  username: string,
  password: string,
  role: AppRole,
): Promise<AppUser> {
  const normalized = username.trim();
  if (!/^[a-zA-Z0-9._-]{3,64}$/.test(normalized))
    throw new Error("Nombre de usuario inválido.");
  if (role !== "ADMINISTRATION" && role !== "AUDITOR")
    throw new Error("Rol inválido.");
  const verifier = await createPasswordVerifier(password);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db
    .prepare(
      "INSERT INTO app_users (id, username, role, password_salt, password_hash, password_iterations, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)",
    )
    .bind(
      id,
      normalized,
      role,
      verifier.salt,
      verifier.hash,
      verifier.iterations,
      now,
      now,
    )
    .run();
  const user = await findUserByUsername(db, normalized);
  if (!user) throw new Error("No se pudo crear el usuario.");
  return user;
}
async function sessionForUser(
  request: Request,
  db: D1Database,
  secret: string,
): Promise<AuthSession | null> {
  if (!secret) return null;
  const token = cookieFromRequest(request);
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = await hmac(secret, payload);
  if (
    !equalBytes(
      new TextEncoder().encode(signature),
      new TextEncoder().encode(expected),
    )
  )
    return null;
  const [userId, expires] = payload.split(":");
  const expiresAt = Number(expires);
  if (
    !userId ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000)
  )
    return null;
  const row = await db
    .prepare(
      "SELECT id, username, role, active, created_at, updated_at, last_login_at FROM app_users WHERE id = ? LIMIT 1",
    )
    .bind(userId)
    .first<Record<string, unknown>>();
  if (!row) return null;
  const user = rowToUser(row);
  return user.active ? { user } : null;
}
/**
 * @proposito API pública authenticate: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export async function authenticate(
  request: Request,
  db: D1Database,
  secret: string,
  username: string,
  password: string,
): Promise<{ sessionCookie: string; user: AppUser } | null> {
  const user = await findUserByUsername(db, username);
  if (!user) {
    await writeAudit(db, "login", "FAILURE", undefined, undefined, {
      username: username.trim(),
    });
    return null;
  }
  const row = await db
    .prepare(
      "SELECT password_salt, password_hash, password_iterations, active FROM app_users WHERE id = ? LIMIT 1",
    )
    .bind(user.id)
    .first<Record<string, unknown>>();
  if (
    !row ||
    Number(row.active) !== 1 ||
    !(await verifyPassword(
      password,
      String(row.password_salt),
      String(row.password_hash),
      Number(row.password_iterations),
    ))
  ) {
    await writeAudit(db, "login", "FAILURE", undefined, user, {
      username: user.username,
    });
    return null;
  }
  const now = new Date().toISOString();
  await db
    .prepare(
      "UPDATE app_users SET last_login_at = ?, updated_at = ? WHERE id = ?",
    )
    .bind(now, now, user.id)
    .run();
  const refreshed = { ...user, lastLoginAt: now };
  const payload = `${user.id}:${Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS}`;
  const signature = await hmac(secret, payload);
  await writeAudit(db, "login", "SUCCESS", refreshed);
  return {
    user: refreshed,
    sessionCookie: `${SESSION_COOKIE}=${payload}.${signature}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Strict`,
  };
}
/**
 * @proposito API pública getSession: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export async function getSession(
  request: Request,
  db: D1Database,
  secret: string,
): Promise<AuthSession | null> {
  const session = await sessionForUser(request, db, secret);
  if (!session) {
    if (request.headers.get("cookie"))
      await writeAudit(db, "session_rejected", "DENIED");
  }
  return session;
}
/**
 * @proposito API pública requireRole: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export async function requireRole(
  request: Request,
  db: D1Database,
  secret: string,
  roles: readonly AppRole[],
): Promise<AuthSession | Response> {
  const session = await getSession(request, db, secret);
  if (!session)
    return Response.json(
      { error: "Autenticación requerida." },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  if (!roles.includes(session.user.role)) {
    await writeAudit(db, "authorization_denied", "DENIED", session.user);
    return Response.json(
      { error: "Permisos insuficientes." },
      { status: 403, headers: { "cache-control": "no-store" } },
    );
  }
  return session;
}
/**
 * @proposito API pública logout: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export async function logout(
  request: Request,
  db: D1Database,
  secret: string,
): Promise<Response> {
  const session = await getSession(request, db, secret);
  if (session) await writeAudit(db, "logout", "SUCCESS", session.user);
  return new Response(null, {
    status: 204,
    headers: {
      "cache-control": "no-store",
      "set-cookie": `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`,
    },
  });
}

/**
 * @proposito API pública clearSessionCookie: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`;
}
/**
 * @proposito API pública setUserActive: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export async function setUserActive(
  db: D1Database,
  actor: AppUser,
  userId: string,
  active: boolean,
): Promise<AppUser> {
  const row = await db
    .prepare(
      "SELECT id, username, role, active, created_at, updated_at, last_login_at FROM app_users WHERE id = ? LIMIT 1",
    )
    .bind(userId)
    .first<Record<string, unknown>>();
  if (!row) throw new Error("Usuario no encontrado.");
  const target = rowToUser(row);
  if (target.id === actor.id && !active)
    throw new Error("La Administración no puede desactivarse a sí misma.");
  const now = new Date().toISOString();
  await db
    .prepare("UPDATE app_users SET active = ?, updated_at = ? WHERE id = ?")
    .bind(active ? 1 : 0, now, userId)
    .run();
  const updated = { ...target, active, updatedAt: now };
  await writeAudit(
    db,
    active ? "user_enabled" : "user_disabled",
    "SUCCESS",
    actor,
    updated,
  );
  return updated;
}
/**
 * @proposito API pública changeUserPassword: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export async function changeUserPassword(
  db: D1Database,
  actor: AppUser,
  userId: string,
  password: string,
): Promise<AppUser> {
  const row = await db
    .prepare(
      "SELECT id, username, role, active, created_at, updated_at, last_login_at FROM app_users WHERE id = ? LIMIT 1",
    )
    .bind(userId)
    .first<Record<string, unknown>>();
  if (!row) throw new Error("Usuario no encontrado.");
  const target = rowToUser(row);
  const verifier = await createPasswordVerifier(password);
  const now = new Date().toISOString();
  await db.prepare("UPDATE app_users SET password_salt = ?, password_hash = ?, password_iterations = ?, updated_at = ? WHERE id = ?")
    .bind(verifier.salt, verifier.hash, verifier.iterations, now, userId).run();
  const updated = { ...target, updatedAt: now };
  await writeAudit(db, "password_changed", "SUCCESS", actor, updated);
  return updated;
}
/**
 * @proposito API pública deleteUserByUsername: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export async function deleteUserByUsername(
  db: D1Database,
  username: string,
): Promise<void> {
  const normalized = username.trim();
  if (!/^ci-smoke-[a-zA-Z0-9-]{3,64}$/.test(normalized)) {
    throw new Error(
      "Solo se pueden eliminar cuentas de smoke con prefijo ci-smoke-.",
    );
  }
  const user = await findUserByUsername(db, normalized);
  if (!user) return;
  await db.prepare("DELETE FROM app_users WHERE id = ?").bind(user.id).run();
  await writeAudit(db, "smoke_user_deleted", "SUCCESS", undefined, user);
}
