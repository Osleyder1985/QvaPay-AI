-- Reserva atómica e historial mínimo de operaciones P2P.
-- La unicidad por offer_uuid comparte la protección entre ejecución manual y Auto Apply.
CREATE TABLE IF NOT EXISTS p2p_operations (
  id TEXT PRIMARY KEY,
  offer_uuid TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL CHECK (source IN ('MANUAL', 'AUTO_APPLY')),
  actor_user_id TEXT,
  actor_username TEXT,
  apply_status TEXT NOT NULL CHECK (
    apply_status IN ('RESERVED', 'APPLYING', 'CONFIRMED', 'REJECTED', 'AMBIGUOUS')
  ),
  detail_status TEXT NOT NULL CHECK (
    detail_status IN ('NOT_REQUESTED', 'PENDING', 'AVAILABLE', 'FAILED')
  ),
  provider_http_status INTEGER,
  detail_error_code TEXT CHECK (
    detail_error_code IS NULL OR detail_error_code IN ('TIMEOUT', 'HTTP_5XX', 'UNAVAILABLE', 'CONTRACT')
  ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_p2p_operations_status_updated
  ON p2p_operations(apply_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_p2p_operations_source_created
  ON p2p_operations(source, created_at DESC);
