import { describe, expect, it, vi } from "vitest";
import { scanMarket } from "../../src/application/use-cases/scan-market.js";

describe("scanMarket", () => {
  it("requests BUY and SELL books independently for the same coin", async () => {
    const provider = {
      fetchOffers: vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: "buy-1",
            market: "BANK_CUP",
            side: "BUY",
            rate: "1000",
            amount: "100",
            availableAmount: "100",
            sourceTimestamp: "2026-10-04T00:00:00.000Z",
            observedAt: "2026-10-04T00:00:01.000Z",
          },
        ])
        .mockResolvedValueOnce([
          {
            id: "sell-1",
            market: "BANK_CUP",
            side: "SELL",
            rate: "1050",
            amount: "100",
            availableAmount: "100",
            sourceTimestamp: "2026-10-04T00:00:00.000Z",
            observedAt: "2026-10-04T00:00:01.000Z",
          },
        ]),
    };

    const market = await scanMarket(provider, "BANK_CUP");

    expect(provider.fetchOffers).toHaveBeenNthCalledWith(1, "BANK_CUP", "BUY");
    expect(provider.fetchOffers).toHaveBeenNthCalledWith(2, "BANK_CUP", "SELL");
    expect(market.offers.map((offer) => offer.id)).toEqual(["buy-1", "sell-1"]);
  });
});
