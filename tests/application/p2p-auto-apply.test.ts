import { describe, expect, it, vi } from "vitest";
import { findAutoApplyCandidate, normalizeAutoApplyConfig } from "../../src/application/p2p-auto-apply.js";
import type { Offer } from "../../src/domain/offer.js";

const offer = (overrides: Partial<Offer>): Offer => ({
  id: "offer",
  market: "BANK_CUP",
  side: "SELL",
  rate: "995",
  amount: "100",
  availableAmount: "100",
  status: "open",
  sourceTimestamp: "2026-10-06T00:00:00.000Z",
  observedAt: "2026-10-06T00:00:00.000Z",
  createdAt: "2026-10-06T00:00:00.000Z",
  creatorUsername: "trader",
  creatorVip: false,
  onlyVip: false,
  fiatAmount: "99500",
  ...overrides,
});

describe("Auto Apply strategy", () => {
  const config = normalizeAutoApplyConfig({
    enabled: true,
    buy: { maxRate: "1000", maxCupAmount: "100000" },
    sell: { minRate: "1000" },
  });

  it("selects a SELL offer for the BUY action using strict rate and CUP limits", () => {
    const candidate = findAutoApplyCandidate(
      [
        offer({ id: "buy-me", side: "SELL", rate: "999", fiatAmount: "99000" }),
        offer({ id: "too-expensive", side: "SELL", rate: "1001", fiatAmount: "100" }),
      ],
      config,
      { qusd: "500" },
    );

    expect(candidate?.action).toBe("BUY");
    expect(candidate?.offer.id).toBe("buy-me");
  });

  it("uses the configured BUY boundary as a strict less-than rate", () => {
    expect(
      findAutoApplyCandidate(
        [offer({ id: "equal", side: "SELL", rate: "1000", fiatAmount: "100" })],
        config,
        { qusd: "500" },
      ),
    ).toBeNull();
  });

  it("selects a BUY offer for the SELL action when QUSD is available", () => {
    const candidate = findAutoApplyCandidate(
      [offer({ id: "sell-me", side: "BUY", rate: "1005", amount: "250", fiatAmount: "251250" })],
      config,
      { qusd: "250" },
    );

    expect(candidate?.action).toBe("SELL");
    expect(candidate?.offer.id).toBe("sell-me");
  });

  it("does not select a SELL action when the offer exceeds the account QUSD balance", () => {
    expect(
      findAutoApplyCandidate(
        [offer({ id: "too-large", side: "BUY", rate: "1005", amount: "250.01" })],
        config,
        { qusd: "250" },
      ),
    ).toBeNull();
  });

  it("requires Auto Apply to be enabled", () => {
    const disabled = { ...config, enabled: false };
    expect(
      findAutoApplyCandidate(
        [offer({ side: "SELL", rate: "999", fiatAmount: "100" })],
        disabled,
        { qusd: "500" },
      ),
    ).toBeNull();
  });
});
