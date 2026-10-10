import { describe, expect, it } from "vitest";
import type { Offer } from "../../src/domain/offer.js";
import {
  executeAutoApplyCandidate,
  type AutoApplyExecutionPorts,
} from "../../src/application/p2p-auto-apply-executor.js";

const offer: Offer = {
  id: "offer-1",
  market: "QUSD",
  side: "BUY",
  rate: "350",
  amount: "10",
  availableAmount: "10",
  status: "open",
  sourceTimestamp: "2026-10-10T11:59:00.000Z",
  observedAt: "2026-10-10T11:59:00.000Z",
  fiatAmount: "3500",
};
const strategy = {
  enabled: true,
  decision: {
    action: "BUY" as const,
    expectedCoin: "QUSD",
    rateThreshold: "360",
    amountLimit: "4000",
    nowMs: Date.parse("2026-10-10T12:00:00.000Z"),
    maxSnapshotAgeMs: 120_000,
    accountEligible: true,
    accountVipVerified: true,
  },
};
function fakePorts(overrides: Partial<AutoApplyExecutionPorts> = {}) {
  const calls = {
    apply: 0,
    decisions: [] as string[],
    outcomes: [] as string[],
    claims: 0,
  };
  const ports: AutoApplyExecutionPorts = {
    loadStrategy: async () => strategy,
    loadEligibleOffers: async () => [offer],
    reserve: async (offerUuid) => ({
      operationId: offerUuid,
      created: true,
      status: "RESERVED",
    }),
    recordDecision: async ({ reason }) => {
      calls.decisions.push(reason);
    },
    claim: async () => {
      calls.claims += 1;
      return true;
    },
    applyOnce: async () => {
      calls.apply += 1;
      return { status: "CONFIRMED" };
    },
    recordOutcome: async (_id, status) => {
      calls.outcomes.push(status);
    },
    releaseUnclaimed: async () => undefined,
    ...overrides,
  };
  return { calls, ports };
}
describe("executeAutoApplyCandidate", () => {
  it("no invoca al proveedor cuando no existe configuración habilitada", async () => {
    const { calls, ports } = fakePorts({
      loadStrategy: async () => null,
    });
    expect(await executeAutoApplyCandidate(ports)).toEqual({
      examined: 0,
      eligible: 0,
      attempted: 0,
      skipped: 0,
    });
    expect(calls.apply).toBe(0);
  });
  it("audita antes de reclamar y aplica como máximo una vez", async () => {
    const { calls, ports } = fakePorts({
      recordDecision: async ({ reason }) => {
        expect(calls.apply).toBe(0);
        calls.decisions.push(reason);
      },
    });
    expect(await executeAutoApplyCandidate(ports)).toEqual({
      examined: 1,
      eligible: 1,
      attempted: 1,
      skipped: 0,
    });
    expect(calls).toMatchObject({
      apply: 1,
      claims: 1,
      decisions: ["ELIGIBLE"],
      outcomes: ["CONFIRMED"],
    });
  });
  it("no envía POST si otro origen ya reservó la oferta", async () => {
    const { calls, ports } = fakePorts({
      reserve: async () => ({
        operationId: "existing",
        created: false,
        status: "APPLYING",
      }),
    });
    expect(await executeAutoApplyCandidate(ports)).toMatchObject({
      attempted: 0,
      skipped: 1,
    });
    expect(calls.apply).toBe(0);
  });
  it("registra el timeout del proveedor como ambiguo y no reintenta", async () => {
    const { calls, ports } = fakePorts({
      applyOnce: async () => {
        calls.apply += 1;
        throw new Error("timeout");
      },
    });
    await executeAutoApplyCandidate(ports);
    expect(calls.apply).toBe(1);
    expect(calls.outcomes).toEqual(["AMBIGUOUS"]);
  });
  it("no envía POST si falla la auditoría previa", async () => {
    const { calls, ports } = fakePorts({
      recordDecision: async () => {
        throw new Error("D1 unavailable");
      },
    });
    expect(await executeAutoApplyCandidate(ports)).toMatchObject({
      attempted: 0,
      skipped: 1,
    });
    expect(calls.apply).toBe(0);
  });
});
