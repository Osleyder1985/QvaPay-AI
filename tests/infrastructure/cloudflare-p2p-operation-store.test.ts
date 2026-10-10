import { describe, expect, it } from "vitest";
import type { D1Database } from "@cloudflare/workers-types";
import {
  claimP2POperation,
  getP2POperation,
  recordP2PApplyOutcome,
  recordP2PDetailOutcome,
  reserveP2POperation,
} from "../../src/infrastructure/cloudflare/p2p-operation-store.js";

function database() {
  const rows = new Map<string, Record<string, unknown>>();
  const offerIndex = new Map<string, string>();

  const db = {
    prepare(sql: string) {
      let args: unknown[] = [];
      return {
        bind(...values: unknown[]) {
          args = values;
          return this;
        },
        async run() {
          if (sql.startsWith("INSERT INTO p2p_operations")) {
            const [
              id,
              offerUuid,
              source,
              actorUserId,
              actorUsername,
              createdAt,
              updatedAt,
            ] = args;
            if (offerIndex.has(String(offerUuid))) {
              return { success: true, meta: { changes: 0 } } as never;
            }
            rows.set(String(id), {
              id,
              offer_uuid: offerUuid,
              source,
              actor_user_id: actorUserId,
              actor_username: actorUsername,
              apply_status: "RESERVED",
              detail_status: "NOT_REQUESTED",
              provider_http_status: null,
              detail_error_code: null,
              created_at: createdAt,
              updated_at: updatedAt,
            });
            offerIndex.set(String(offerUuid), String(id));
            return { success: true, meta: { changes: 1 } } as never;
          }

          if (
            sql.includes("SET apply_status = 'APPLYING'") &&
            sql.includes("apply_status = 'RESERVED'")
          ) {
            const [updatedAt, id] = args;
            const row = rows.get(String(id));
            if (!row || row.apply_status !== "RESERVED") {
              return { success: true, meta: { changes: 0 } } as never;
            }
            row.apply_status = "APPLYING";
            row.updated_at = updatedAt;
            return { success: true, meta: { changes: 1 } } as never;
          }

          if (sql.includes("SET apply_status = ?")) {
            const [status, detailStatus, httpStatus, updatedAt, id] = args;
            const row = rows.get(String(id));
            if (!row || row.apply_status !== "APPLYING") {
              return { success: true, meta: { changes: 0 } } as never;
            }
            row.apply_status = status;
            row.detail_status = detailStatus;
            row.provider_http_status = httpStatus;
            row.detail_error_code = null;
            row.updated_at = updatedAt;
            return { success: true, meta: { changes: 1 } } as never;
          }

          if (sql.includes("SET detail_status = ?")) {
            const [detailStatus, errorCode, updatedAt, id] = args;
            const row = rows.get(String(id));
            if (
              !row ||
              row.apply_status !== "CONFIRMED" ||
              !["PENDING", "FAILED"].includes(String(row.detail_status))
            ) {
              return { success: true, meta: { changes: 0 } } as never;
            }
            row.detail_status = detailStatus;
            row.detail_error_code = errorCode;
            row.updated_at = updatedAt;
            return { success: true, meta: { changes: 1 } } as never;
          }

          throw new Error("Consulta no simulada en esta prueba: " + sql);
        },
        async first<T>() {
          const key = String(args[0]);
          const id = sql.includes("WHERE offer_uuid = ?")
            ? offerIndex.get(key)
            : key;
          return (id ? (rows.get(id) ?? null) : null) as T | null;
        },
      };
    },
  } as unknown as D1Database;

  return { db, rows };
}

const input = {
  offerUuid: "offer-001",
  source: "MANUAL" as const,
  actorUserId: "admin-001",
  actorUsername: "admin",
  now: "2026-10-10T12:00:00.000Z",
};

describe("P2P operation idempotency store", () => {
  it("permite una sola reserva concurrente entre origen manual y automático", async () => {
    const { db } = database();
    const [manual, automatic] = await Promise.all([
      reserveP2POperation(db, input),
      reserveP2POperation(db, {
        ...input,
        source: "AUTO_APPLY",
        actorUserId: null,
        actorUsername: null,
      }),
    ]);

    expect([manual.created, automatic.created].filter(Boolean)).toHaveLength(1);
    expect(manual.operation.id).toBe(automatic.operation.id);
    expect(manual.operation.offerUuid).toBe(input.offerUuid);
    expect(manual.operation.applyStatus).toBe("RESERVED");
  });

  it("permite reclamar una reserva una sola vez y registra apply confirmado", async () => {
    const { db } = database();
    const reservation = await reserveP2POperation(db, input);
    const claims = await Promise.all([
      claimP2POperation(db, reservation.operation.id, input.now),
      claimP2POperation(db, reservation.operation.id, input.now),
    ]);

    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(
      await recordP2PApplyOutcome(
        db,
        reservation.operation.id,
        "CONFIRMED",
        201,
        input.now,
      ),
    ).toBe(true);
    expect(
      await recordP2PApplyOutcome(
        db,
        reservation.operation.id,
        "CONFIRMED",
        201,
        input.now,
      ),
    ).toBe(false);

    const stored = await getP2POperation(db, reservation.operation.id);
    expect(stored?.applyStatus).toBe("CONFIRMED");
    expect(stored?.detailStatus).toBe("PENDING");
  });

  it("mantiene una reserva ambigua y no permite un segundo intento", async () => {
    const { db } = database();
    const reservation = await reserveP2POperation(db, input);
    await claimP2POperation(db, reservation.operation.id, input.now);
    await recordP2PApplyOutcome(
      db,
      reservation.operation.id,
      "AMBIGUOUS",
      null,
      input.now,
    );

    const duplicate = await reserveP2POperation(db, {
      ...input,
      source: "AUTO_APPLY",
    });
    expect(duplicate.created).toBe(false);
    expect(duplicate.operation.id).toBe(reservation.operation.id);
    expect(duplicate.operation.applyStatus).toBe("AMBIGUOUS");
    expect(
      await claimP2POperation(db, duplicate.operation.id, input.now),
    ).toBe(false);
  });

  it("permite recuperar el detalle sin degradar la aplicación confirmada", async () => {
    const { db } = database();
    const reservation = await reserveP2POperation(db, input);
    await claimP2POperation(db, reservation.operation.id, input.now);
    await recordP2PApplyOutcome(
      db,
      reservation.operation.id,
      "CONFIRMED",
      201,
      input.now,
    );

    expect(
      await recordP2PDetailOutcome(
        db,
        reservation.operation.id,
        { available: false, errorCode: "TIMEOUT" },
        input.now,
      ),
    ).toBe(true);
    expect(
      await recordP2PDetailOutcome(
        db,
        reservation.operation.id,
        { available: true },
        input.now,
      ),
    ).toBe(true);

    const stored = await getP2POperation(db, reservation.operation.id);
    expect(stored?.applyStatus).toBe("CONFIRMED");
    expect(stored?.detailStatus).toBe("AVAILABLE");
    expect(stored?.detailErrorCode).toBeNull();
  });
});
