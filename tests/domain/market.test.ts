import { describe, expect, it } from "vitest";
import { createMarket, offersBySide } from "../../src/domain/market.js";
import type { Offer } from "../../src/domain/offer.js";

const offer = (
  id: string,
  side: Offer["side"],
  rate: string,
  market = "BANK_CUP",
): Offer => ({
  id,
  market,
  side,
  rate,
  amount: "100",
  availableAmount: "100",
    status: "open",
  sourceTimestamp: "2026-10-04T00:00:00.000Z",
  observedAt: "2026-10-04T00:00:00.000Z",
});

describe("market domain", () => {
  it("keeps BUY and SELL books independent and sorts each by ascending rate", () => {
    const market = createMarket("BANK_CUP", [
      offer("sell-2", "SELL", "1200"),
      offer("buy-2", "BUY", "1150"),
      offer("sell-1", "SELL", "1000"),
      offer("buy-1", "BUY", "900"),
    ]);

    expect(offersBySide(market, "SELL").map((item) => item.id)).toEqual([
      "sell-1",
      "sell-2",
    ]);
    expect(offersBySide(market, "BUY").map((item) => item.id)).toEqual([
      "buy-1",
      "buy-2",
    ]);
  });

  it("rejects an offer belonging to another market", () => {
    expect(() =>
      createMarket("BANK_CUP", [offer("wrong", "SELL", "1000", "OTHER_CUP")]),
    ).toThrow("Offer market does not match market identity");
  });
});
