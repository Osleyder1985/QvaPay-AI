import { describe, expect, it } from "vitest";
import type {
  D1Database,
  D1PreparedStatement,
} from "@cloudflare/workers-types";
import type { QvaPayAccountSnapshot } from "../../src/infrastructure/qvapay/account-contract.js";
import {
  getCurrentQvaPayAccountSnapshot,
  getLastSuccessfulQvaPayAccountSnapshot,
  persistQvaPayAccountSnapshot,
} from "../../src/infrastructure/cloudflare/qvapay-account-snapshot-store.js";

function snapshot(
  integrationStatus: QvaPayAccountSnapshot["integrationStatus"],
): QvaPayAccountSnapshot {
  return {
    balanceUsd: 125.5,
    balanceSource: {
      endpoint: "/v2/balance",
      retrievedAt: "2026-10-07T01:00:00.000Z",
      httpStatus: 200,
      status: "verified",
      error: null,
    },
    balanceHttpStatus: 200,
    balanceOk: true,
    balanceError: null,
    identity: {
      uuid: "owner-uuid",
      username: "owner-user",
      name: "Owner",
      lastname: "Account",
      image: null,
      email: "owner@example.com",
      bio: "Owner bio",
      balance: 77.25,
      satoshis: 123,
      phone: "+123456789",
      phoneVerified: true,
      goldenExpire: "2030-01-01T00:00:00.000Z",
      p2pEnabled: true,
      savingsRoundup: false,
      cover: null,
      twitter: "@owner",
      telegram: "owner",
      twoFactorEnabled: true,
      ratingAvg: 4.8,
      ratingCount: null,
      kyc: true,
      vip: null,
      goldenCheck: true,
      telegramVerified: true,
      completedAsOwner: null,
      completedAsPeer: null,
    },
    identityProvenance: {
      endpoint: "/user",
      retrievedAt: "2026-10-07T01:00:02.000Z",
      httpStatus: 200,
      status: "verified",
      error: null,
    },
    identitySource: "/user",
    identityHttpStatus: 200,
    identityOk: true,
    identityError: null,
    application: {
      uuid: "app-uuid",
      name: "QvaPay AI",
      url: null,
      description: null,
      callback: null,
      successUrl: null,
      cancelUrl: null,
      logo: null,
      appPhotoUrl: null,
      active: true,
      enabled: true,
      card: false,
      createdAt: null,
      updatedAt: null,
    },
    applicationProvenance: {
      endpoint: "/v2/info",
      retrievedAt: "2026-10-07T01:00:01.000Z",
      httpStatus: 200,
      status: "verified",
      error: null,
    },
    applicationHttpStatus: 200,
    applicationOk: true,
    ownerCorrelationOk: true,
    ownerCorrelationProvenance: {
      endpoint: "/app/app-uuid",
      retrievedAt: "2026-10-07T01:00:01.500Z",
      httpStatus: 200,
      status: "verified",
      error: null,
    },
    p2pAccessible: true,
    ownOffersTotal: 3,
    ownOffersProvenance: {
      endpoint: "/p2p?my=1&take=1&page=1",
      retrievedAt: "2026-10-07T01:00:03.000Z",
      httpStatus: 200,
      status: "verified",
      error: null,
    },
    integrationStatus,
    fetchedAt: "2026-10-07T01:00:03.000Z",
  };
}

function database(rows: Array<Record<string, unknown>> = []) {
  const statements: Array<{ sql: string; args: unknown[] }> = [];
  const db = {
    prepare(sql: string) {
      const statement = {
        bind(...args: unknown[]) {
          statements.push({ sql, args });
          return statement;
        },
        async first<T>() {
          statements.push({ sql, args: [] });
          return (rows[0] ?? null) as T | null;
        },
      } as unknown as D1PreparedStatement;
      return statement;
    },
    async batch() {
      return [{ success: true }] as never;
    },
  } as unknown as D1Database;
  return { db, statements };
}

describe("QvaPay account snapshot store", () => {
  it("persiste snapshots normalizados con versión de esquema y marcador de estado exitoso", async () => {
    const { db, statements } = database();
    const result = await persistQvaPayAccountSnapshot(db, snapshot("verified"));

    expect(result.schemaVersion).toBe(1);
    expect(result.integrationStatus).toBe("verified");
    expect(
      statements.some((entry) =>
        entry.sql.includes("INSERT INTO qvapay_account_snapshots"),
      ),
    ).toBe(true);

    const insert = statements.find((entry) =>
      entry.sql.includes("INSERT INTO qvapay_account_snapshots"),
    );
    expect(insert).toBeDefined();
    expect(insert?.args).toContain(1);

    const serialized = String(insert?.args[5]);
    expect(serialized).toContain('"username":"owner-user"');
    expect(serialized).not.toContain("two_factor_secret");
    expect(serialized).not.toContain("app-secret");
  });

  it("lee el snapshot actual y el último snapshot exitoso sin llamar a QvaPay", async () => {
    const row = {
      id: "snapshot-1",
      schema_version: 1,
      integration_status: "verified",
      captured_at: "2026-10-07T01:00:03.000Z",
      persisted_at: "2026-10-07T01:00:04.000Z",
      snapshot_json: JSON.stringify(snapshot("verified")),
    };
    const { db, statements } = database([row]);

    const current = await getCurrentQvaPayAccountSnapshot(db);
    const successful = await getLastSuccessfulQvaPayAccountSnapshot(db);

    expect(current?.id).toBe("snapshot-1");
    expect(successful?.snapshot.identity?.username).toBe("owner-user");
    expect(
      statements.filter((entry) => entry.sql.startsWith("SELECT")).length,
    ).toBe(2);
  });
});
