import { describe, expect, it } from "vitest";
import type { Offer } from "../../src/domain/offer.js";
import { evaluateAutoApplyDecision } from "../../src/application/p2p-auto-apply-decision.js";

const nowMs = Date.parse("2026-10-10T12:00:00.000Z");
const offer = (overrides: Partial<Offer> = {}): Offer => ({
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
  ...overrides,
});
const input = (
  overrides: Partial<Parameters<typeof evaluateAutoApplyDecision>[0]> = {},
) => ({
  enabled: true,
  action: "BUY" as const,
  offer: offer(),
  expectedCoin: "QUSD",
  rateThreshold: "360",
  amountLimit: "4000",
  nowMs,
  maxSnapshotAgeMs: 120_000,
  accountEligible: true,
  accountVipVerified: true,
  accountBalanceQusd: { available: true, fresh: true, amount: "100" },
  ...overrides,
});

describe("evaluateAutoApplyDecision", () => {
  it("acepta BUY solo con tasa estrictamente menor y CUP dentro del límite", () => {
    expect(evaluateAutoApplyDecision(input())).toMatchObject({
      eligible: true,
      offerUuid: "offer-1",
    });
    expect(
      evaluateAutoApplyDecision(input({ offer: offer({ rate: "360" }) })),
    ).toMatchObject({
      eligible: false,
      reason: "BUY_RATE_NOT_BELOW_THRESHOLD",
    });
    expect(
      evaluateAutoApplyDecision(input({ offer: offer({ fiatAmount: "4001" }) })),
    ).toMatchObject({
      eligible: false,
      reason: "BUY_CUP_LIMIT_EXCEEDED",
    });
  });

  it("rechaza cuando está desactivado, la cuenta no está verificada o el snapshot venció", () => {
    expect(
      evaluateAutoApplyDecision(input({ enabled: false })),
    ).toMatchObject({
      eligible: false,
      reason: "DISABLED",
    });
    expect(
      evaluateAutoApplyDecision(input({ accountEligible: false })),
    ).toMatchObject({
      eligible: false,
      reason: "ACCOUNT_NOT_VERIFIED",
    });
    expect(
      evaluateAutoApplyDecision(
        input({ offer: offer({ observedAt: "2026-10-10T11:50:00.000Z" }) }),
      ),
    ).toMatchObject({
      eligible: false,
      reason: "SNAPSHOT_STALE",
    });
  });

  it("falla cerrado en SELL si el balance QUSD no está disponible/fresco o es insuficiente", () => {
    const sell = offer({
      side: "SELL",
      rate: "370",
      amount: "20",
      fiatAmount: "7400",
    });
    expect(
      evaluateAutoApplyDecision(
        input({
          action: "SELL",
          offer: sell,
          rateThreshold: "360",
          amountLimit: "25",
          accountBalanceQusd: null,
        }),
      ),
    ).toMatchObject({
      eligible: false,
      reason: "SELL_BALANCE_UNAVAILABLE",
    });
    expect(
      evaluateAutoApplyDecision(
        input({
          action: "SELL",
          offer: sell,
          rateThreshold: "360",
          amountLimit: "25",
          accountBalanceQusd: { available: true, fresh: true, amount: "10" },
        }),
      ),
    ).toMatchObject({
      eligible: false,
      reason: "SELL_QUSD_LIMIT_EXCEEDED",
    });
  });

  it("rechaza configuración decimal inválida y snapshots futuros", () => {
    expect(
      evaluateAutoApplyDecision(input({ rateThreshold: "no-numero" })),
    ).toMatchObject({
      eligible: false,
      reason: "INVALID_CONFIGURATION",
    });
    expect(
      evaluateAutoApplyDecision(
        input({ offer: offer({ observedAt: "2026-10-10T12:00:01.000Z" }) }),
      ),
    ).toMatchObject({
      eligible: false,
      reason: "SNAPSHOT_STALE",
    });
    expect(
      evaluateAutoApplyDecision(input({ maxSnapshotAgeMs: 0 })),
    ).toMatchObject({
      eligible: false,
      reason: "INVALID_CONFIGURATION",
    });
  });

  it("aplica SELL con comparación estricta de tasa y límites QUSD", () => {
    const sell = offer({
      side: "SELL",
      rate: "370",
      amount: "20",
      fiatAmount: "7400",
    });
    expect(
      evaluateAutoApplyDecision(
        input({
          action: "SELL",
          offer: sell,
          rateThreshold: "360",
          amountLimit: "20",
          accountBalanceQusd: { available: true, fresh: true, amount: "20" },
        }),
      ),
    ).toMatchObject({ eligible: true, action: "SELL" });
    expect(
      evaluateAutoApplyDecision(
        input({
          action: "SELL",
          offer: offer({ ...sell, rate: "360" }),
          rateThreshold: "360",
          amountLimit: "20",
          accountBalanceQusd: { available: true, fresh: true, amount: "20" },
        }),
      ),
    ).toMatchObject({
      eligible: false,
      reason: "SELL_RATE_NOT_ABOVE_THRESHOLD",
    });
    expect(
      evaluateAutoApplyDecision(
        input({
          action: "SELL",
          offer: sell,
          rateThreshold: "360",
          amountLimit: "19",
          accountBalanceQusd: { available: true, fresh: true, amount: "20" },
        }),
      ),
    ).toMatchObject({
      eligible: false,
      reason: "SELL_QUSD_LIMIT_EXCEEDED",
    });
  });

  it("rechaza moneda, estado y elegibilidad VIP incompatibles", () => {
    expect(
      evaluateAutoApplyDecision(input({ offer: offer({ market: "OTHER" }) })),
    ).toMatchObject({
      eligible: false,
      reason: "MARKET_MISMATCH",
    });
    expect(
      evaluateAutoApplyDecision(input({ offer: offer({ status: "processing" }) })),
    ).toMatchObject({
      eligible: false,
      reason: "OFFER_NOT_OPEN",
    });
    expect(
      evaluateAutoApplyDecision(
        input({
          accountVipVerified: false,
          offer: offer({ onlyVip: true, creatorVip: true }),
        }),
      ),
    ).toMatchObject({
      eligible: false,
      reason: "VIP_REQUIRED",
    });
  });
});
