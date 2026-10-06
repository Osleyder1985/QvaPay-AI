import type { D1Database } from "@cloudflare/workers-types";
import { createUser, type AppUser } from "./auth-rbac.js";

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

export async function bootstrapInitialAdmin(
  db: D1Database,
  bootstrapToken: string,
  presentedToken: string,
  username: string,
  password: string,
): Promise<AppUser> {
  if (!bootstrapToken || !presentedToken || !constantTimeEqual(bootstrapToken, presentedToken)) {
    throw new Error("Token de configuración inválido.");
  }

  const count = await db
    .prepare("SELECT COUNT(*) AS count FROM app_users")
    .first<{ count: number }>();

  if (Number(count?.count ?? 0) !== 0) {
    throw new Error("La configuración inicial ya fue completada.");
  }

  const user = await createUser(db, username, password, "ADMINISTRATION");
  await db
    .prepare(
      "INSERT INTO security_audit_log (id, occurred_at, actor_user_id, actor_username, event_type, outcome, target_user_id, target_username, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      crypto.randomUUID(),
      new Date().toISOString(),
      user.id,
      user.username,
      "initial_admin_bootstrapped",
      "SUCCESS",
      user.id,
      user.username,
      JSON.stringify({ purpose: "initial_application_setup" }),
    )
    .run();
  return user;
}
