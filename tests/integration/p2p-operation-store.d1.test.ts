/**
 * @archivo tests/integration/p2p-operation-store.d1.test.ts
 * @proposito Verificar idempotencia y reclamación concurrente usando el binding D1 real del runtime local Workers.
 * @responsabilidades Ejecutar consultas SQL contra Miniflare D1, sin mocks de la capa de persistencia.
 * @dependencias cloudflare:test y p2p-operation-store.ts.
 * @seguridad Solo crea identificadores sintéticos; nunca llama a QvaPay ni ejecuta operaciones financieras.
 * @ubicacion Pruebas de integración de infraestructura P2P.
 */

import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import type { D1Database } from "@cloudflare/workers-types";
import {
  claimP2POperation,
  ensureP2POperationSchema,
  getP2POperation,
  reserveP2POperation,
} from "../../src/infrastructure/cloudflare/p2p-operation-store.js";

function getTestDatabase(): D1Database {
  return (env as unknown as { DB: D1Database }).DB;
}

describe("P2P operation store with local Cloudflare D1", () => {
  it("serializa la reserva concurrente MANUAL/AUTO_APPLY mediante la restricción UNIQUE", async () => {
    const db = getTestDatabase();
    await ensureP2POperationSchema(db);
    const offerUuid = `d1-concurrency-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const [manual, automatic] = await Promise.all([
      reserveP2POperation(db, {
        offerUuid,
        source: "MANUAL",
        actorUserId: "integration-admin",
        actorUsername: "integration-admin",
        now,
      }),
      reserveP2POperation(db, {
        offerUuid,
        source: "AUTO_APPLY",
        actorUserId: null,
        actorUsername: null,
        now,
      }),
    ]);

    expect([manual.created, automatic.created].filter(Boolean)).toHaveLength(1);
    expect(manual.operation.id).toBe(automatic.operation.id);
    expect(manual.operation.offerUuid).toBe(offerUuid);
    expect(["MANUAL", "AUTO_APPLY"]).toContain(manual.operation.source);
    expect((await getP2POperation(db, manual.operation.id))?.applyStatus).toBe(
      "RESERVED",
    );
  });

  it("permite una sola transición concurrente RESERVED → APPLYING", async () => {
    const db = getTestDatabase();
    await ensureP2POperationSchema(db);
    const offerUuid = `d1-claim-${crypto.randomUUID()}`;
    const reservation = await reserveP2POperation(db, {
      offerUuid,
      source: "MANUAL",
      actorUserId: "integration-admin",
      actorUsername: "integration-admin",
      now: new Date().toISOString(),
    });

    const claims = await Promise.all([
      claimP2POperation(db, reservation.operation.id),
      claimP2POperation(db, reservation.operation.id),
    ]);

    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(
      (await getP2POperation(db, reservation.operation.id))?.applyStatus,
    ).toBe("APPLYING");
  });
});
