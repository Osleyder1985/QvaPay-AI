import type { D1Database } from "@cloudflare/workers-types";
import type {
  QvaPayAccountIntegrationStatus,
  QvaPayAccountSnapshot,
} from "../qvapay/account-contract.js";

const ACCOUNT_SNAPSHOT_SCHEMA_VERSION = 1;

export interface PersistedQvaPayAccountSnapshot {
  readonly id: string;
  readonly schemaVersion: number;
  readonly integrationStatus: QvaPayAccountIntegrationStatus;
  readonly capturedAt: string;
  readonly persistedAt: string;
  readonly snapshot: QvaPayAccountSnapshot;
}

function rowToSnapshot(
  row: Record<string, unknown>,
): PersistedQvaPayAccountSnapshot {
  const parsed = JSON.parse(String(row.snapshot_json)) as QvaPayAccountSnapshot;
  return {
    id: String(row.id),
    schemaVersion: Number(row.schema_version),
    integrationStatus: String(
      row.integration_status,
    ) as QvaPayAccountIntegrationStatus,
    capturedAt: String(row.captured_at),
    persistedAt: String(row.persisted_at),
    snapshot: parsed,
  };
}

export async function persistQvaPayAccountSnapshot(
  db: D1Database,
  snapshot: QvaPayAccountSnapshot,
): Promise<PersistedQvaPayAccountSnapshot> {
  const id = crypto.randomUUID();
  const capturedAt = snapshot.fetchedAt;
  const persistedAt = new Date().toISOString();
  const successful = snapshot.integrationStatus === "verified" ? 1 : 0;

  const result = await db.batch([
    db.prepare(
      "UPDATE qvapay_account_snapshots SET is_current = 0 WHERE is_current = 1",
    ),
    ...(successful
      ? [
          db.prepare(
            "UPDATE qvapay_account_snapshots SET is_last_successful = 0 WHERE is_last_successful = 1",
          ),
        ]
      : []),
    db
      .prepare(
        "INSERT INTO qvapay_account_snapshots (id, schema_version, integration_status, captured_at, persisted_at, snapshot_json, is_current, is_last_successful) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
      )
      .bind(
        id,
        ACCOUNT_SNAPSHOT_SCHEMA_VERSION,
        snapshot.integrationStatus,
        capturedAt,
        persistedAt,
        JSON.stringify(snapshot),
        successful,
      ),
  ]);

  if (result.length === 0) {
    throw new Error("No se pudo registrar el snapshot de Cuenta.");
  }

  return {
    id,
    schemaVersion: ACCOUNT_SNAPSHOT_SCHEMA_VERSION,
    integrationStatus: snapshot.integrationStatus,
    capturedAt,
    persistedAt,
    snapshot,
  };
}

export async function getCurrentQvaPayAccountSnapshot(
  db: D1Database,
): Promise<PersistedQvaPayAccountSnapshot | null> {
  const row = await db
    .prepare(
      "SELECT id, schema_version, integration_status, captured_at, persisted_at, snapshot_json FROM qvapay_account_snapshots WHERE is_current = 1 ORDER BY captured_at DESC LIMIT 1",
    )
    .first<Record<string, unknown>>();
  return row ? rowToSnapshot(row) : null;
}

export async function getLastSuccessfulQvaPayAccountSnapshot(
  db: D1Database,
): Promise<PersistedQvaPayAccountSnapshot | null> {
  const row = await db
    .prepare(
      "SELECT id, schema_version, integration_status, captured_at, persisted_at, snapshot_json FROM qvapay_account_snapshots WHERE is_last_successful = 1 ORDER BY captured_at DESC LIMIT 1",
    )
    .first<Record<string, unknown>>();
  return row ? rowToSnapshot(row) : null;
}
