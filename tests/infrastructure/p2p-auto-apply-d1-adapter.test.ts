import { describe, expect, it, vi } from "vitest";
import type { D1Database } from "@cloudflare/workers-types";
import {
  QvaPayAmbiguousOperationError,
  QvaPayProviderError,
} from "../../src/infrastructure/qvapay/qvapay-p2p-client.js";
import {
  createD1AutoApplyExecutionPorts,
  createQvaPayAutoApplyProvider,
} from "../../src/infrastructure/cloudflare/p2p-auto-apply-d1-adapter.js";
import type { QvaPayAccountClient } from "../../src/infrastructure/qvapay/qvapay-account-client.js";
import type { QvaPayP2PClient } from "../../src/infrastructure/qvapay/qvapay-p2p-client.js";
import { executeAutoApplyCandidate } from "../../src/application/p2p-auto-apply-executor.js";

function unusedDatabase(): D1Database {
  return {
    prepare: vi.fn(() => {
      throw new Error("D1 no debe consultarse sin estrategia habilitada");
    }),
    batch: vi.fn(() => {
      throw new Error("D1 no debe consultarse sin estrategia habilitada");
    }),
  } as unknown as D1Database;
}

describe("createD1AutoApplyExecutionPorts", () => {
  it("falla cerrado sin estrategia y no toca D1 ni al proveedor", async () => {
    const applyOffer = vi.fn(async () => ({}));
    const db = unusedDatabase();
    const ports = createD1AutoApplyExecutionPorts({
      db,
      provider: { applyOffer },
    });

    await expect(executeAutoApplyCandidate(ports)).resolves.toEqual({
      examined: 0,
      eligible: 0,
      attempted: 0,
      skipped: 0,
    });
    expect(applyOffer).not.toHaveBeenCalled();
    expect(db.prepare).not.toHaveBeenCalled();
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("no confirma una respuesta exitosa sin reconciliar detalle e identidad", async () => {
    const applyOffer = vi.fn(async () => ({ success: true }));
    const ports = createD1AutoApplyExecutionPorts({
      db: unusedDatabase(),
      provider: { applyOffer },
    });

    await expect(ports.applyOnce("offer-1")).resolves.toEqual({
      status: "AMBIGUOUS",
      httpStatus: null,
    });
    expect(applyOffer).toHaveBeenCalledTimes(1);
  });

  it("confirma solo con detalle processing e identidad verificada coincidente", async () => {
    const applyOffer = vi.fn(async () => ({ success: true }));
    const fetchOfferDetail = vi.fn(async () => ({
      uuid: "offer-1",
      status: "processing",
      peerUuid: "verified-account-1",
    }));
    const getVerifiedAccountUuid = vi.fn(async () => "verified-account-1");
    const ports = createD1AutoApplyExecutionPorts({
      db: unusedDatabase(),
      provider: { applyOffer, fetchOfferDetail, getVerifiedAccountUuid },
    });

    await expect(ports.applyOnce("offer-1")).resolves.toEqual({
      status: "CONFIRMED",
    });
    expect(fetchOfferDetail).toHaveBeenCalledWith("offer-1");
    expect(getVerifiedAccountUuid).toHaveBeenCalledTimes(1);
    expect(applyOffer).toHaveBeenCalledTimes(1);
  });

  it("mantiene AMBIGUOUS si el detalle no coincide con la identidad verificada", async () => {
    const applyOffer = vi.fn(async () => ({ success: true }));
    const fetchOfferDetail = vi.fn(async () => ({
      uuid: "offer-1",
      status: "processing",
      peerUuid: "different-account",
    }));
    const getVerifiedAccountUuid = vi.fn(async () => "verified-account-1");
    const ports = createD1AutoApplyExecutionPorts({
      db: unusedDatabase(),
      provider: { applyOffer, fetchOfferDetail, getVerifiedAccountUuid },
    });

    await expect(ports.applyOnce("offer-1")).resolves.toEqual({
      status: "AMBIGUOUS",
      httpStatus: null,
    });
    expect(applyOffer).toHaveBeenCalledTimes(1);
  });

  it("clasifica un timeout ambiguo sin reintentar el proveedor", async () => {
    const applyOffer = vi.fn(async () => {
      throw new QvaPayAmbiguousOperationError("offer-1");
    });
    const ports = createD1AutoApplyExecutionPorts({
      db: unusedDatabase(),
      provider: { applyOffer },
    });

    await expect(ports.applyOnce("offer-1")).resolves.toEqual({
      status: "AMBIGUOUS",
      httpStatus: null,
    });
    expect(applyOffer).toHaveBeenCalledTimes(1);
  });

  it("reconcilia una operación sin volver a invocar applyOffer", async () => {
    const statement = {
      bind: vi.fn().mockReturnThis(),
      run: vi.fn(async () => ({ meta: { changes: 1 } })),
      first: vi.fn(async () => ({
        id: "operation-1",
        offer_uuid: "offer-1",
        source: "AUTO_APPLY",
        actor_user_id: null,
        actor_username: null,
        apply_status: "AMBIGUOUS",
        detail_status: "NOT_REQUESTED",
        provider_http_status: null,
        detail_error_code: null,
        created_at: "2026-10-10T12:00:00.000Z",
        updated_at: "2026-10-10T12:00:00.000Z",
      })),
    };
    const prepare = vi.fn(() => statement);
    const db = {
      prepare,
      batch: vi.fn(async () => []),
    } as unknown as D1Database;
    const applyOffer = vi.fn(async () => ({ success: true }));
    const fetchOfferDetail = vi.fn(async () => ({
      uuid: "offer-1",
      status: "processing",
      peerUuid: "verified-account-1",
    }));
    const getVerifiedAccountUuid = vi.fn(async () => "verified-account-1");
    const ports = createD1AutoApplyExecutionPorts({
      db,
      provider: { applyOffer, fetchOfferDetail, getVerifiedAccountUuid },
      now: () => "2026-10-10T12:00:00.000Z",
    });

    await expect(ports.reconcileOnce("operation-1", "offer-1")).resolves.toBe(
      "CONFIRMED",
    );
    expect(fetchOfferDetail).toHaveBeenCalledWith("offer-1");
    expect(getVerifiedAccountUuid).toHaveBeenCalledTimes(1);
    expect(applyOffer).not.toHaveBeenCalled();
    expect(statement.run).toHaveBeenCalledTimes(1);
    expect(prepare).toHaveBeenCalled();
  });

  it("rechaza reconciliar una oferta que no pertenece al operationId indicado", async () => {
    const statement = {
      bind: vi.fn().mockReturnThis(),
      run: vi.fn(async () => ({ meta: { changes: 1 } })),
      first: vi.fn(async () => ({
        id: "operation-1",
        offer_uuid: "different-offer",
        source: "AUTO_APPLY",
        actor_user_id: null,
        actor_username: null,
        apply_status: "AMBIGUOUS",
        detail_status: "NOT_REQUESTED",
        provider_http_status: null,
        detail_error_code: null,
        created_at: "2026-10-10T12:00:00.000Z",
        updated_at: "2026-10-10T12:00:00.000Z",
      })),
    };
    const db = {
      prepare: vi.fn(() => statement),
      batch: vi.fn(async () => []),
    } as unknown as D1Database;
    const fetchOfferDetail = vi.fn();
    const getVerifiedAccountUuid = vi.fn();
    const applyOffer = vi.fn();
    const ports = createD1AutoApplyExecutionPorts({
      db,
      provider: { applyOffer, fetchOfferDetail, getVerifiedAccountUuid },
    });

    await expect(ports.reconcileOnce("operation-1", "offer-1")).resolves.toBe(
      "AMBIGUOUS",
    );
    expect(fetchOfferDetail).not.toHaveBeenCalled();
    expect(getVerifiedAccountUuid).not.toHaveBeenCalled();
    expect(applyOffer).not.toHaveBeenCalled();
    expect(statement.run).not.toHaveBeenCalled();
  });

  it("recupera un fallo real de persistencia posterior al POST sin repetirlo", async () => {
    const statement = {
      bind: vi.fn().mockReturnThis(),
      run: vi.fn(async (sql?: string) => {
        if (sql?.includes("SET apply_status = ?")) {
          throw new Error("Fallo simulado de escritura tras el POST");
        }
        return { meta: { changes: 1 } };
      }),
      first: vi.fn(async () => ({
        id: "operation-crash",
        offer_uuid: "offer-crash",
        source: "AUTO_APPLY",
        actor_user_id: null,
        actor_username: null,
        apply_status: "APPLYING",
        detail_status: "NOT_REQUESTED",
        provider_http_status: null,
        detail_error_code: null,
        created_at: "2026-10-10T12:00:00.000Z",
        updated_at: "2026-10-10T12:00:00.000Z",
      })),
    };
    const db = {
      prepare: vi.fn((sql: string) => ({
        ...statement,
        run: () => statement.run(sql),
      })),
      batch: vi.fn(async () => []),
    } as unknown as D1Database;
    const applyOffer = vi.fn(async () => ({ success: true }));
    const fetchOfferDetail = vi.fn(async () => ({
      uuid: "offer-crash",
      status: "processing",
      peerUuid: "verified-account-crash",
    }));
    const getVerifiedAccountUuid = vi.fn(async () => "verified-account-crash");
    const ports = createD1AutoApplyExecutionPorts({
      db,
      provider: { applyOffer, fetchOfferDetail, getVerifiedAccountUuid },
      now: () => "2026-10-10T12:01:00.000Z",
    });

    await expect(ports.applyOnce("offer-crash")).resolves.toEqual({
      status: "CONFIRMED",
    });
    await expect(
      ports.recordOutcome("operation-crash", "CONFIRMED", 201),
    ).rejects.toThrow("Fallo simulado de escritura tras el POST");

    await expect(
      ports.reconcileOnce("operation-crash", "offer-crash"),
    ).resolves.toBe("CONFIRMED");
    expect(applyOffer).toHaveBeenCalledTimes(1);
    expect(fetchOfferDetail).toHaveBeenCalledTimes(2);
    expect(getVerifiedAccountUuid).toHaveBeenCalledTimes(2);
  });

  it("mantiene ambigua la operación cuando la reconciliación no confirma la identidad", async () => {
    const statement = {
      bind: vi.fn().mockReturnThis(),
      run: vi.fn(async () => ({ meta: { changes: 1 } })),
      first: vi.fn(async () => ({
        id: "operation-1",
        offer_uuid: "offer-1",
        source: "AUTO_APPLY",
        actor_user_id: null,
        actor_username: null,
        apply_status: "AMBIGUOUS",
        detail_status: "NOT_REQUESTED",
        provider_http_status: null,
        detail_error_code: null,
        created_at: "2026-10-10T12:00:00.000Z",
        updated_at: "2026-10-10T12:00:00.000Z",
      })),
    };
    const prepare = vi.fn(() => statement);
    const db = {
      prepare,
      batch: vi.fn(async () => []),
    } as unknown as D1Database;
    const applyOffer = vi.fn(async () => ({ success: true }));
    const ports = createD1AutoApplyExecutionPorts({
      db,
      provider: {
        applyOffer,
        fetchOfferDetail: async () => ({
          uuid: "offer-1",
          status: "processing",
          peerUuid: "some-other-account",
        }),
        getVerifiedAccountUuid: async () => "verified-account-1",
      },
    });

    await expect(ports.reconcileOnce("operation-1", "offer-1")).resolves.toBe(
      "AMBIGUOUS",
    );
    expect(applyOffer).not.toHaveBeenCalled();
    expect(prepare).toHaveBeenCalled();
  });

  it("clasifica un rechazo explícito 4xx como REJECTED sin reintentar", async () => {
    const applyOffer = vi.fn(async () => {
      throw new QvaPayProviderError(403, "No autorizado", "invalid-request");
    });
    const ports = createD1AutoApplyExecutionPorts({
      db: unusedDatabase(),
      provider: { applyOffer },
    });

    await expect(ports.applyOnce("offer-1")).resolves.toEqual({
      status: "REJECTED",
      httpStatus: 403,
    });
    expect(applyOffer).toHaveBeenCalledTimes(1);
  });
});

describe("createQvaPayAutoApplyProvider", () => {
  it("usa la identidad de /user solo con integración y correlación verificadas", async () => {
    const fetchOfferDetail = vi.fn(async () => ({
      uuid: "offer-1",
      status: "processing",
      coin: "QUSD",
      side: "sell" as const,
      onlyVip: false,
      onlyKyc: false,
      ownerUuid: "owner-1",
      peerUuid: "account-verified",
    }));
    const p2pClient = {
      applyOffer: vi.fn(async () => ({ success: true })),
      fetchOfferDetail,
    } as unknown as Pick<QvaPayP2PClient, "applyOffer" | "fetchOfferDetail">;
    const accountClient = {
      fetchAccount: vi.fn(
        async () =>
          ({
            integrationStatus: "verified",
            identitySource: "/user",
            identityProvenance: { status: "verified" },
            identityOk: true,
            ownerCorrelationOk: true,
            identity: { uuid: "account-verified" },
          }) as unknown as Awaited<
            ReturnType<QvaPayAccountClient["fetchAccount"]>
          >,
      ),
    } as Pick<QvaPayAccountClient, "fetchAccount">;

    const provider = createQvaPayAutoApplyProvider(p2pClient, accountClient);
    await expect(provider.getVerifiedAccountUuid?.()).resolves.toBe(
      "account-verified",
    );
    await expect(provider.fetchOfferDetail?.("offer-1")).resolves.toEqual({
      uuid: "offer-1",
      status: "processing",
      peerUuid: "account-verified",
    });
  });

  it("rechaza la identidad si el snapshot /user no está completamente verificado", async () => {
    const accountClient = {
      fetchAccount: vi.fn(
        async () =>
          ({
            integrationStatus: "degraded",
            identitySource: "/user",
            identityProvenance: { status: "verified" },
            identityOk: true,
            ownerCorrelationOk: false,
            identity: { uuid: "account-unverified" },
          }) as unknown as Awaited<
            ReturnType<QvaPayAccountClient["fetchAccount"]>
          >,
      ),
    } as Pick<QvaPayAccountClient, "fetchAccount">;
    const p2pClient = {
      applyOffer: vi.fn(async () => ({ success: true })),
      fetchOfferDetail: vi.fn(),
    } as unknown as Pick<QvaPayP2PClient, "applyOffer" | "fetchOfferDetail">;

    const provider = createQvaPayAutoApplyProvider(p2pClient, accountClient);
    await expect(provider.getVerifiedAccountUuid?.()).resolves.toBeNull();
  });
});
