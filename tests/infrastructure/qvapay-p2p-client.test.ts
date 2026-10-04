import { describe, expect, it, vi } from "vitest";
import {
  QvaPayAuthenticationError,
  QvaPayP2PClient,
  QvaPayRateLimitError,
  QvaPayValidationError,
} from "../../src/infrastructure/qvapay/qvapay-p2p-client.js";

const page = (current_page: number, last_page: number, uuid: string, type: "buy" | "sell" = "sell") => ({
  data: [
    {
      uuid,
      type,
      coin: "BANK_CUP",
      amount: "100",
      receive: "100000",
      available_amount: "100",
    },
  ],
  current_page,
  last_page,
  per_page: 1,
  total: last_page,
});

describe("QvaPay P2P client", () => {
  it("queries the requested book independently", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(page(1, 1, "sell-one")), { status: 200 }),
    );

    const client = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      fetcher,
    });

    await client.fetchOffers("BANK_CUP", "SELL");

    expect(fetcher).toHaveBeenCalledWith(
      expect.objectContaining({
        search: expect.any(Function),
      }),
      { method: "GET" },
    );
    const requestedUrl = String(fetcher.mock.calls[0]?.[0]);
    expect(requestedUrl).toContain("coin=BANK_CUP");
    expect(requestedUrl).toContain("type=sell");
  });

  it("fetches every page of the requested book", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(page(1, 2, "one")), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(page(2, 2, "two")), { status: 200 }),
      );

    const client = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      fetcher,
      take: 1,
    });
    const offers = await client.fetchOffers(
      "BANK_CUP",
      "SELL",
      "2026-10-04T00:00:00.000Z",
    );

    expect(offers.map((offer) => offer.id)).toEqual(["one", "two"]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("backs off and retries a 429 response", async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("rate limited", {
          status: 429,
          headers: { "retry-after": "7" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(page(1, 1, "one")), { status: 200 }),
      );

    const client = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      fetcher,
      sleep,
    });

    const offers = await client.fetchOffers("BANK_CUP", "SELL");

    expect(offers).toHaveLength(1);
    expect(sleep).toHaveBeenCalledWith(7000);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("classifies authentication failures", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("unauthorized", { status: 401 }));
    const client = new QvaPayP2PClient({ baseUrl: "https://api.qvapay.com", fetcher });

    await expect(client.fetchOffers("BANK_CUP", "SELL")).rejects.toBeInstanceOf(
      QvaPayAuthenticationError,
    );
  });

  it("classifies client validation failures", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("bad request", { status: 400 }));
    const client = new QvaPayP2PClient({ baseUrl: "https://api.qvapay.com", fetcher });

    await expect(client.fetchOffers("BANK_CUP", "SELL")).rejects.toBeInstanceOf(
      QvaPayValidationError,
    );
  });

  it("does not retry 429 indefinitely", async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fetcher = vi.fn().mockResolvedValue(
      new Response("rate limited", {
        status: 429,
        headers: { "retry-after": "1" },
      }),
    );

    const client = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      fetcher,
      maxRetries: 2,
      sleep,
    });

    await expect(client.fetchOffers("BANK_CUP", "SELL")).rejects.toMatchObject({
      name: QvaPayRateLimitError.name,
      retryAfterSeconds: 1,
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
