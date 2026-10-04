import { describe, expect, it, vi } from "vitest";
import { QvaPayP2PClient, QvaPayRateLimitError } from "../../src/infrastructure/qvapay/qvapay-p2p-client.js";

const page = (current_page: number, last_page: number, uuid: string) => ({
  data: [{
    uuid,
    type: "sell",
    coin: "BANK_CUP",
    amount: "100",
    receive: "100000",
    available_amount: "100",
  }],
  current_page,
  last_page,
  per_page: 1,
  total: last_page,
});

describe("QvaPay P2P client", () => {
  it("fetches every page", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(page(1, 2, "one")), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(page(2, 2, "two")), { status: 200 }));

    const client = new QvaPayP2PClient({ baseUrl: "https://api.qvapay.com", fetcher, take: 1 });
    const offers = await client.fetchOffers("BANK_CUP", "2026-10-04T00:00:00.000Z");

    expect(offers.map((offer) => offer.id)).toEqual(["one", "two"]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("classifies 429 responses", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response("rate limited", { status: 429, headers: { "retry-after": "7" } }),
    );

    const client = new QvaPayP2PClient({ baseUrl: "https://api.qvapay.com", fetcher });
    await expect(client.fetchOffers("BANK_CUP")).rejects.toMatchObject({
      name: QvaPayRateLimitError.name,
      retryAfterSeconds: 7,
    });
  });
});