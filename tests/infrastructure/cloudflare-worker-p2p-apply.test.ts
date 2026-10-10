import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureSecuritySchema: vi.fn(),
  requireRole: vi.fn(),
  accountFetch: vi.fn(),
  persistAccount: vi.fn(),
  ensureOperationSchema: vi.fn(),
  reserveOperation: vi.fn(),
  releaseReservation: vi.fn(),
  claimOperation: vi.fn(),
  recordApplyOutcome: vi.fn(),
  recordDetailOutcome: vi.fn(),
  recordOperationAudit: vi.fn(),
  applyOffer: vi.fn(),
  fetchOfferDetail: vi.fn(),
  getState: vi.fn(),
}));

vi.mock("../../src/infrastructure/cloudflare/auth-rbac.js", () => ({
  authenticate: vi.fn(),
  createUser: vi.fn(),
  deleteUserByUsername: vi.fn(),
  ensureSecuritySchema: mocks.ensureSecuritySchema,
  getSession: vi.fn(),
  listUsers: vi.fn(),
  logout: vi.fn(),
  requireRole: mocks.requireRole,
  setUserActive: vi.fn(),
  changeUserPassword: vi.fn(),
}));

vi.mock("../../src/infrastructure/cloudflare/scanner-scheduler-do.js", () => ({
  ScannerSchedulerDurableObject: class ScannerSchedulerDurableObject {},
}));

vi.mock("../../src/infrastructure/qvapay/qvapay-account-client.js", () => ({
  QvaPayAccountClient: class QvaPayAccountClient {
    fetchAccount = mocks.accountFetch;
  },
}));

vi.mock(
  "../../src/infrastructure/cloudflare/qvapay-account-snapshot-store.js",
  () => ({
    getCurrentQvaPayAccountSnapshot: vi.fn(),
    getLastSuccessfulQvaPayAccountSnapshot: vi.fn(),
    persistQvaPayAccountSnapshot: mocks.persistAccount,
  }),
);

vi.mock("../../src/infrastructure/qvapay/qvapay-p2p-client.js", () => ({
  QvaPayAmbiguousOperationError: class QvaPayAmbiguousOperationError extends Error {},
  QvaPayP2PClient: class QvaPayP2PClient {
    applyOffer = mocks.applyOffer;
    fetchOfferDetail = mocks.fetchOfferDetail;
  },
  QvaPayProviderError: class QvaPayProviderError extends Error {
    status = 400;
  },
  QvaPayTransientError: class QvaPayTransientError extends Error {},
}));

vi.mock("../../src/infrastructure/cloudflare/p2p-operation-store.js", () => ({
  claimP2POperation: mocks.claimOperation,
  ensureP2POperationSchema: mocks.ensureOperationSchema,
  getP2POperation: vi.fn(),
  recordP2PApplyOutcome: mocks.recordApplyOutcome,
  recordP2PDetailOutcome: mocks.recordDetailOutcome,
  recordP2POperationAudit: mocks.recordOperationAudit,
  releaseReservedP2POperation: mocks.releaseReservation,
  reserveP2POperation: mocks.reserveOperation,
}));

import worker from "../../src/infrastructure/cloudflare/worker.js";
import type { ScannerWorkerEnvironment } from "../../src/infrastructure/cloudflare/worker.js";

const administrator = {
  user: {
    id: "admin-1",
    username: "admin-test",
    role: "ADMINISTRATION" as const,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: null,
  },
};

const accountSnapshot = {
  integrationStatus: "verified",
  ownerCorrelationOk: true,
  identity: {
    uuid: "account-owner",
    username: "admin-test",
    name: "Administrator",
    p2pEnabled: true,
    kyc: true,
    phoneVerified: true,
    telegramVerified: true,
    vip: false,
  },
  fetchedAt: new Date().toISOString(),
};

function createEnvironment(): ScannerWorkerEnvironment {
  return {
    DB: {
      prepare: vi.fn(),
      batch: vi.fn(),
    } as unknown as ScannerWorkerEnvironment["DB"],
    SCANNER_SCHEDULER: {
      getByName: vi.fn(() => ({ getState: mocks.getState })),
    } as unknown as ScannerWorkerEnvironment["SCANNER_SCHEDULER"],
    QVAPAY_API_BASE_URL: "https://api.qvapay.com",
    QVAPAY_APP_ID: "test-app",
    QVAPAY_APP_SECRET: "test-secret",
    QVAPAY_USER_API_TOKEN: "test-user-token",
    SCANNER_COIN: "BANK_CUP",
    SCANNER_INTERVAL_SECONDS: "10",
    SCANNER_BOOTSTRAP_TOKEN: "boot-test",
    PRODUCTION_SMOKE_TOKEN: "test-smoke-token",
    ACCOUNT_AUTH_SECRET: "test-session-secret",
  };
}

const openOfferDetail = {
  uuid: "offer-123",
  status: "open",
  coin: "BANK_CUP",
  side: "sell" as const,
  onlyVip: false,
  onlyKyc: false,
  ownerUuid: "another-account",
  peerUuid: null,
};

const confirmedOfferDetail = {
  uuid: "offer-123",
  status: "processing",
  ownerUuid: "another-account",
  peerUuid: "account-owner",
};

function runtimeState() {
  const observedAt = new Date().toISOString();
  return {
    execution: { lastError: null },
    market: {
      coin: "BANK_CUP",
      offers: [
        {
          id: "offer-123",
          market: "BANK_CUP",
          side: "SELL",
          status: "open",
          observedAt,
          onlyVip: false,
        },
      ],
    },
  };
}

function reservation() {
  return {
    created: true,
    operation: {
      id: "operation-123",
      offerUuid: "offer-123",
      source: "MANUAL",
      actorUserId: "admin-1",
      actorUsername: "admin-test",
      applyStatus: "RESERVED",
      detailStatus: "NOT_REQUESTED",
      providerHttpStatus: null,
      detailErrorCode: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

async function applyRequest(env: ScannerWorkerEnvironment): Promise<Response> {
  return worker.fetch(
    new Request("https://qvapay-ai.test/api/p2p/offer-123/apply", {
      method: "POST",
    }),
    env,
  );
}

describe("Cloudflare Worker: aplicación P2P protegida", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.ensureSecuritySchema.mockResolvedValue(undefined);
    mocks.requireRole.mockResolvedValue(administrator);
    mocks.accountFetch.mockResolvedValue(accountSnapshot);
    mocks.persistAccount.mockResolvedValue(undefined);
    mocks.ensureOperationSchema.mockResolvedValue(undefined);
    mocks.reserveOperation.mockResolvedValue(reservation());
    mocks.releaseReservation.mockResolvedValue(true);
    mocks.claimOperation.mockResolvedValue(true);
    mocks.recordApplyOutcome.mockResolvedValue(true);
    mocks.recordDetailOutcome.mockResolvedValue(true);
    mocks.recordOperationAudit.mockResolvedValue(undefined);
    mocks.applyOffer.mockResolvedValue({ message: "Aplicado a la oferta" });
    mocks.fetchOfferDetail
      .mockResolvedValueOnce(openOfferDetail)
      .mockResolvedValueOnce(confirmedOfferDetail);
    mocks.getState.mockResolvedValue(runtimeState());
  });

  it("reserva, audita y aplica una sola vez; el detalle se registra por separado", async () => {
    const response = await applyRequest(createEnvironment());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      operationId: "operation-123",
      applyStatus: "CONFIRMED",
      detailStatus: "AVAILABLE",
      auditStatus: "RECORDED",
    });
    expect(mocks.accountFetch).toHaveBeenCalledOnce();
    expect(mocks.persistAccount).toHaveBeenCalledOnce();
    expect(mocks.ensureOperationSchema).toHaveBeenCalledOnce();
    expect(mocks.reserveOperation).toHaveBeenCalledOnce();
    expect(mocks.claimOperation).toHaveBeenCalledOnce();
    expect(mocks.applyOffer).toHaveBeenCalledOnce();
    expect(mocks.applyOffer).toHaveBeenCalledWith("offer-123");
    expect(mocks.fetchOfferDetail).toHaveBeenCalledTimes(2);
    expect(mocks.recordApplyOutcome).toHaveBeenCalledWith(
      expect.anything(),
      "operation-123",
      "CONFIRMED",
      null,
    );
    expect(mocks.recordDetailOutcome).toHaveBeenCalledWith(
      expect.anything(),
      "operation-123",
      { available: true },
    );
    expect(mocks.recordOperationAudit).toHaveBeenCalledTimes(3);
  });

  it("conserva la aplicación confirmada si la consulta posterior del detalle falla", async () => {
    mocks.fetchOfferDetail
      .mockReset()
      .mockResolvedValueOnce(openOfferDetail)
      .mockRejectedValueOnce(new Error("synthetic detail outage"));

    const response = await applyRequest(createEnvironment());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      applyStatus: "CONFIRMED",
      detailStatus: "FAILED",
    });
    expect(mocks.applyOffer).toHaveBeenCalledOnce();
    expect(mocks.recordApplyOutcome).toHaveBeenCalledWith(
      expect.anything(),
      "operation-123",
      "CONFIRMED",
      null,
    );
    expect(mocks.recordDetailOutcome).toHaveBeenCalledWith(
      expect.anything(),
      "operation-123",
      { available: false, errorCode: "CONTRACT" },
    );
  });

  it("mantiene APPLYING si falla D1 tras el POST y reconcilia sin repetirlo", async () => {
    mocks.recordApplyOutcome.mockRejectedValueOnce(new Error("synthetic D1 outage"));
    const first = await applyRequest(createEnvironment());

    expect(first.status).toBe(202);
    await expect(first.json()).resolves.toMatchObject({ applyStatus: "APPLYING" });
    expect(mocks.applyOffer).toHaveBeenCalledOnce();

    mocks.reserveOperation.mockResolvedValueOnce({
      created: false,
      operation: { ...reservation().operation, applyStatus: "APPLYING" },
    });
    mocks.recordApplyOutcome.mockResolvedValueOnce(true);
    mocks.fetchOfferDetail.mockReset().mockResolvedValue({
      ...confirmedOfferDetail,
      coin: "BANK_CUP",
      side: "sell",
      status: "processing",
      onlyVip: false,
      onlyKyc: false,
    });

    const second = await applyRequest(createEnvironment());
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toMatchObject({
      applyStatus: "CONFIRMED",
      detailStatus: "AVAILABLE",
      reconciled: true,
    });
    expect(mocks.applyOffer).toHaveBeenCalledOnce();
    expect(mocks.fetchOfferDetail).toHaveBeenCalledOnce();
  });

  it("no confirma APPLYING cuando Peer.uuid no coincide con la cuenta verificada", async () => {
    mocks.reserveOperation.mockResolvedValue({
      created: false,
      operation: { ...reservation().operation, applyStatus: "APPLYING" },
    });
    mocks.fetchOfferDetail.mockReset().mockResolvedValue({
      ...confirmedOfferDetail,
      coin: "BANK_CUP",
      side: "sell",
      status: "processing",
      peerUuid: "different-account",
      onlyVip: false,
      onlyKyc: false,
    });

    const response = await applyRequest(createEnvironment());
    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toMatchObject({ applyStatus: "APPLYING" });
    expect(mocks.applyOffer).not.toHaveBeenCalled();
    expect(mocks.recordApplyOutcome).not.toHaveBeenCalled();
  });

  it("recupera el detalle de una aplicación confirmada aunque la oferta esté en processing", async () => {
    const existing = reservation().operation;
    mocks.reserveOperation.mockResolvedValue({
      created: false,
      operation: {
        ...existing,
        applyStatus: "CONFIRMED",
        detailStatus: "FAILED",
      },
    });
    mocks.getState.mockResolvedValue({
      ...runtimeState(),
      market: {
        coin: "BANK_CUP",
        offers: [
          {
            id: "offer-123",
            market: "BANK_CUP",
            side: "SELL",
            status: "processing",
            observedAt: new Date().toISOString(),
            onlyVip: false,
          },
        ],
      },
    });
    mocks.fetchOfferDetail.mockReset().mockResolvedValue({
      ...confirmedOfferDetail,
      coin: "BANK_CUP",
      side: "sell",
      status: "processing",
      onlyVip: false,
      onlyKyc: false,
    });

    const response = await applyRequest(createEnvironment());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      operationId: "operation-123",
      applyStatus: "CONFIRMED",
      detailStatus: "AVAILABLE",
      alreadyApplied: true,
    });
    expect(mocks.fetchOfferDetail).toHaveBeenCalledOnce();
    expect(mocks.applyOffer).not.toHaveBeenCalled();
    expect(mocks.recordDetailOutcome).toHaveBeenCalledWith(
      expect.anything(),
      "operation-123",
      { available: true },
    );
  });

  it("recupera una aplicación confirmada aunque falle la consulta del snapshot de cuenta", async () => {
    const existing = reservation().operation;
    mocks.reserveOperation.mockResolvedValue({
      created: false,
      operation: {
        ...existing,
        applyStatus: "CONFIRMED",
        detailStatus: "FAILED",
      },
    });
    mocks.accountFetch.mockRejectedValue(
      new Error("synthetic account snapshot outage"),
    );
    mocks.fetchOfferDetail.mockReset().mockResolvedValue({
      ...confirmedOfferDetail,
      coin: "BANK_CUP",
      side: "sell",
      status: "processing",
      onlyVip: false,
      onlyKyc: false,
    });

    const response = await applyRequest(createEnvironment());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      operationId: "operation-123",
      applyStatus: "CONFIRMED",
      detailStatus: "AVAILABLE",
      alreadyApplied: true,
    });
    expect(mocks.accountFetch).not.toHaveBeenCalled();
    expect(mocks.persistAccount).not.toHaveBeenCalled();
    expect(mocks.fetchOfferDetail).toHaveBeenCalledOnce();
    expect(mocks.applyOffer).not.toHaveBeenCalled();
    expect(mocks.recordDetailOutcome).toHaveBeenCalledWith(
      expect.anything(),
      "operation-123",
      { available: true },
    );
  });

  it("bloquea la aplicación si falla la auditoría y no se confirma la liberación", async () => {
    mocks.recordOperationAudit.mockRejectedValueOnce(
      new Error("synthetic audit storage outage"),
    );
    mocks.releaseReservation.mockResolvedValueOnce(false);

    const response = await applyRequest(createEnvironment());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("requiere revisión operativa"),
    });
    expect(mocks.releaseReservation).toHaveBeenCalledOnce();
    expect(mocks.claimOperation).not.toHaveBeenCalled();
    expect(mocks.applyOffer).not.toHaveBeenCalled();
  });

  it("no repite el POST cuando el resultado remoto es ambiguo", async () => {
    mocks.applyOffer.mockRejectedValue(
      new Error("synthetic transport failure"),
    );

    const response = await applyRequest(createEnvironment());

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toMatchObject({
      operationId: "operation-123",
      applyStatus: "AMBIGUOUS",
    });
    expect(mocks.applyOffer).toHaveBeenCalledOnce();
    expect(mocks.recordApplyOutcome).toHaveBeenCalledWith(
      expect.anything(),
      "operation-123",
      "AMBIGUOUS",
      null,
    );
    expect(mocks.fetchOfferDetail).toHaveBeenCalledOnce();
  });

  it("deniega al rol Auditor sin consultar la cuenta ni al proveedor", async () => {
    mocks.requireRole.mockResolvedValue(
      Response.json({ error: "Permisos insuficientes." }, { status: 403 }),
    );

    const response = await applyRequest(createEnvironment());

    expect(response.status).toBe(403);
    expect(mocks.accountFetch).not.toHaveBeenCalled();
    expect(mocks.applyOffer).not.toHaveBeenCalled();
  });
});
