CREATE TABLE IF NOT EXISTS qvapay_account_snapshots (
  id TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL,
  integration_status TEXT NOT NULL CHECK (integration_status IN ('verified','degraded','failed')),
  captured_at TEXT NOT NULL,
  persisted_at TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  is_current INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0,1)),
  is_last_successful INTEGER NOT NULL DEFAULT 0 CHECK (is_last_successful IN (0,1))
);

CREATE INDEX IF NOT EXISTS idx_qvapay_account_snapshots_captured_at
  ON qvapay_account_snapshots(captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_qvapay_account_snapshots_current
  ON qvapay_account_snapshots(is_current, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_qvapay_account_snapshots_last_successful
  ON qvapay_account_snapshots(is_last_successful, captured_at DESC);
