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
  it("vincula el fetcher predeterminado al ámbito global", async () => {
    const originalFetch = globalThis.fetch;
    const calls: URL[] = [];

    globalThis.fetch = function (
      this: typeof globalThis,
      input: RequestInfo | URL,
    ) {
      if (this !== globalThis) {
        throw new TypeError("incorrect this reference");
      }

      const url = input instanceof URL ? input : new URL(String(input));
      calls.push(url);
      const type = url.searchParams.get("type") as "buy" | "sell";
      return Promise.resolve(responseFor(page(1, 1, `${type}-one`, type)));
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

  it("autentica cada solicitud de mercado con credenciales de aplicación", async () => {
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

  it("obtiene cada página de forma independiente para BUY y SELL", async () => {
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

  it("usa Retry-After y reintenta una respuesta 429", async () => {
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
            reject(new DOMException("La operación fue abortada", "AbortError"));
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
        "QvaPay P2P buy page 1 transport error: AbortError: La operación fue abortada",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });
});

describe("QvaPay P2P apply", () => {
  it("aplica una oferta con credenciales de la aplicación", async () => {
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.qvapay.com/p2p/offer-123/apply");
      expect(init?.method).toBe("POST");
      expect(new Headers(init?.headers).get("app-id")).toBe("app-id");
      expect(new Headers(init?.headers).get("app-secret")).toBe("app-secret");
      return new Response(JSON.stringify({ message: "Aplicado a la oferta" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    };

    const client = new QvaPayP2PClient({
      baseUrl: "https://api.qvapay.com",
      appId: "app-id",
      appSecret: "app-secret",
      fetcher,
    });

    await expect(client.applyOffer("offer-123")).resolves.toEqual({
      message: "Aplicado a la oferta",
    });
  });
});
