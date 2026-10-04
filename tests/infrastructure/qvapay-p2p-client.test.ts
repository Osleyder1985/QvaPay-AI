import { describe, expect, it, vi } from "vitest";
import {
  QvaPayP2PClient,
  QvaPayProviderError,
  QvaPayRateLimitError,
  QvaPayTransientError,
} from "../../src/infrastructure/qvapay/qvapay-p2p-client.js";

const page = (
  current_page: number,
  last_page: number,
  uuid: string,
  type: "buy" | "sell",
) => ({
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

const responseFor = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe("QvaPay P2P client", () => {
  it("fetches every page independently for BUY and SELL", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(responseFor(page(1, 2, "buy-one", "buy")))
      .mockResolvedValueOnce(responseFor(page(2, 2, "buy-two", "buy")))
      .mockResolvedValueOnce(responseFor(page(1, 1, "sell-one", "sell")));

    const client = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      fetcher,
      take: 1,
    });
    const offers = await client.fetchOffers(
      "BANK_CUP",
      "2026-10-04T00:00:00.000Z",
    );

    expect(offers.map((offer) => offer.id)).toEqual([
      "buy-one",
      "buy-two",
      "sell-one",
    ]);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(
      fetcher.mock.calls.map(([url]) => url.searchParams.get("type")),
    ).toEqual(["buy", "buy", "sell"]);
  });

  it("uses Retry-After and retries a 429 response", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("rate limited", {
          status: 429,
          headers: { "retry-after": "7" },
        }),
      )
      .mockResolvedValue(responseFor(page(1, 1, "buy-one", "buy")));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const client = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      fetcher,
      sleep,
    });

    await client.fetchOffers("BANK_CUP");
    expect(sleep).toHaveBeenCalledWith(7000);
  });

  it("classifies an exhausted 429 response", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response("rate limited", {
        status: 429,
        headers: { "retry-after": "7" },
      }),
    );

    const client = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      fetcher,
      sleep: vi.fn().mockResolvedValue(undefined),
      maxRetries: 1,
    });

    await expect(client.fetchOffers("BANK_CUP")).rejects.toMatchObject({
      name: QvaPayRateLimitError.name,
      retryAfterSeconds: 7,
    });
  });

  it("classifies 401 and 5xx responses separately", async () => {
    const authClient = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      fetcher: vi
        .fn()
        .mockResolvedValue(new Response("unauthorized", { status: 401 })),
    });

    await expect(authClient.fetchOffers("BANK_CUP")).rejects.toMatchObject({
      name: QvaPayProviderError.name,
      status: 401,
      category: "authentication",
    });

    const transientClient = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      fetcher: vi
        .fn()
        .mockResolvedValue(new Response("server error", { status: 503 })),
      sleep: vi.fn().mockResolvedValue(undefined),
      maxRetries: 0,
    });

    await expect(
      transientClient.fetchOffers("BANK_CUP"),
    ).rejects.toMatchObject({
      name: QvaPayProviderError.name,
      status: 503,
      category: "transient",
    });
  });

  it("classifies exhausted transport failures as transient", async () => {
    const client = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      fetcher: vi.fn().mockRejectedValue(new Error("timeout")),
      sleep: vi.fn().mockResolvedValue(undefined),
      maxRetries: 0,
    });

    await expect(client.fetchOffers("BANK_CUP")).rejects.toBeInstanceOf(
      QvaPayTransientError,
    );
  });
});
