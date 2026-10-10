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
