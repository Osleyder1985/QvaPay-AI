/**
 * @archivo src/infrastructure/cloudflare/initial-admin-setup.ts
 * @proposito Gestiona la creación inicial de la cuenta de Administración.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/infrastructure/cloudflare dentro de la arquitectura de QvaPay-AI.
 */

import type { D1Database } from "@cloudflare/workers-types";
import { createUser, type AppUser } from "./auth-rbac.js";

function validateInitialAdminCredentials(
  username: string,
  password: string,
): void {
  if (!/^[a-zA-Z0-9._-]{3,64}$/.test(username.trim())) {
    throw new Error("Nombre de usuario inválido.");
  }
  if (password.length < 12) {
    throw new Error("La contraseña debe tener al menos 12 caracteres.");
  }
}

export async function bootstrapInitialAdmin(
  db: D1Database,
  username: string,
  password: string,
): Promise<AppUser> {
  validateInitialAdminCredentials(username, password);

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
