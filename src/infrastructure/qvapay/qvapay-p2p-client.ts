import type { Offer } from "../../domain/offer.js";
import { mapQvaPayOffer } from "./p2p-mapper.js";
import { parseP2PPage } from "./p2p-contract.js";

export class QvaPayRateLimitError extends Error {
  readonly retryAfterSeconds: number | undefined;

  constructor(retryAfterSeconds: number | undefined) {
    super("QvaPay P2P rate limit exceeded");
    this.name = "QvaPayRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class QvaPayProviderError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "QvaPayProviderError";
    this.status = status;
  }
}

export interface QvaPayP2PClientOptions {
  readonly baseUrl: string;
  readonly fetcher?: typeof fetch;
  readonly take?: number;
}

export class QvaPayP2PClient {
  private readonly fetcher: typeof fetch;
  private readonly take: number;

  constructor(private readonly options: QvaPayP2PClientOptions) {
    this.fetcher = options.fetcher ?? fetch;
    this.take = options.take ?? 100;

    if (!Number.isInteger(this.take) || this.take < 1 || this.take > 100) {
      throw new Error("QvaPay P2P take must be between 1 and 100");
    }
  }

  async fetchOffers(coin: string, observedAt = new Date().toISOString()): Promise<readonly Offer[]> {
    const offers: Offer[] = [];
    let page = 1;
    let lastPage = 1;

    do {
      const url = new URL("/p2p", this.options.baseUrl);
      url.searchParams.set("coin", coin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("take", String(this.take));
      url.searchParams.set("orderBy", "updated_at");
      url.searchParams.set("orderType", "desc");

      const response = await this.fetcher(url, { method: "GET" });
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const retryAfterSeconds = retryAfter === null ? undefined : Number(retryAfter);
        throw new QvaPayRateLimitError(
          Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
        );
      }

      if (!response.ok) {
        throw new QvaPayProviderError(
          response.status,
          `QvaPay P2P request failed with status ${response.status}`,
        );
      }

      const payload: unknown = await response.json();
      const parsed = parseP2PPage(payload);
      lastPage = parsed.last_page;

      if (parsed.current_page !== page) {
        throw new QvaPayProviderError(502, "QvaPay P2P returned an unexpected page");
      }

      offers.push(...parsed.data.map((offer) => mapQvaPayOffer(offer, observedAt)));
      page += 1;
    } while (page <= lastPage);

    return offers;
  }
}