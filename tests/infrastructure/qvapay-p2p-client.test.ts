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

const credentials = {
  appId: "test-app-id",
  appSecret: "test-app-secret",
};

describe("QvaPay P2P client", () => {
  it("binds the default fetcher to the global scope", async () => {
    const originalFetch = globalThis.fetch;
    const calls: URL[] = [];

    globalThis.fetch = function (this: typeof globalThis, input: RequestInfo | URL) {
      if (this !== globalThis) {
        throw new TypeError("incorrect this reference");
      }

      const url = input instanceof URL ? input : new URL(String(input));
      calls.push(url);
      const type = url.searchParams.get("type") as "buy" | "sell";
      return Promise.resolve(
        responseFor(page(1, 1, `${type}-one`, type)),
      );
    };

    try {
      const client = new QvaPayP2PClient({
        baseUrl: "https://api.qvapay.com",
        ...credentials,
      });

      await client.fetchOffers("BANK_CUP");

      expect(calls.map((url) => url.searchParams.get("type"))).toEqual([
        "buy",
        "sell",
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });


  it("authenticates every market request with application credentials", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(responseFor(page(1, 1, "buy-one", "buy")))
      .mockResolvedValueOnce(responseFor(page(1, 1, "sell-one", "sell")));

    const client = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      ...credentials,
      fetcher,
    });

    await client.fetchOffers("BANK_CUP");

    expect(fetcher.mock.calls).toHaveLength(2);
    for (const [, init] of fetcher.mock.calls) {
      expect(init?.headers).toEqual({
        "app-id": credentials.appId,
        "app-secret": credentials.appSecret,
      });
    }
  });

  it("fetches every page independently for BUY and SELL", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(responseFor(page(1, 2, "buy-one", "buy")))
      .mockResolvedValueOnce(responseFor(page(2, 2, "buy-two", "buy")))
      .mockResolvedValueOnce(responseFor(page(1, 1, "sell-one", "sell")));

    const client = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      ...credentials,
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
      .mockResolvedValueOnce(responseFor(page(1, 1, "buy-one", "buy")))
      .mockResolvedValueOnce(responseFor(page(1, 1, "sell-one", "sell")));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const client = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      ...credentials,
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
      ...credentials,
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
      ...credentials,
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
      ...credentials,
      fetcher: vi
        .fn()
        .mockResolvedValue(new Response("server error", { status: 503 })),
      sleep: vi.fn().mockResolvedValue(undefined),
      maxRetries: 0,
    });

    await expect(transientClient.fetchOffers("BANK_CUP")).rejects.toMatchObject(
      {
        name: QvaPayProviderError.name,
        status: 503,
        category: "transient",
      },
    );
  });

  it("classifies exhausted transport failures with safe operation context", async () => {
    const client = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      ...credentials,
      fetcher: vi.fn().mockRejectedValue(new Error("timeout")),
      sleep: vi.fn().mockResolvedValue(undefined),
      maxRetries: 0,
    });

    await expect(client.fetchOffers("BANK_CUP")).rejects.toMatchObject({
      name: QvaPayTransientError.name,
      message: "QvaPay P2P buy page 1 transport error: Error: timeout",
    });
  });

  it("times out stalled provider requests", async () => {
    const fetcher = vi.fn().mockImplementation(
      (_url: URL, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted", "AbortError"));
          });
        }),
    );

    const client = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      ...credentials,
      fetcher,
      timeoutMs: 1,
      maxRetries: 0,
    });

    await expect(client.fetchOffers("BANK_CUP")).rejects.toMatchObject({
      name: QvaPayTransientError.name,
      message:
        "QvaPay P2P buy page 1 transport error: AbortError: The operation was aborted",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });
});
