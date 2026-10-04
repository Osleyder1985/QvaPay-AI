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

export type QvaPayProviderErrorCategory =
  | "invalid-request"
  | "authentication"
  | "transient"
  | "contract";

export class QvaPayProviderError extends Error {
  readonly status: number;
  readonly category: QvaPayProviderErrorCategory;

  constructor(
    status: number,
    message: string,
    category: QvaPayProviderErrorCategory,
  ) {
    super(message);
    this.name = "QvaPayProviderError";
    this.status = status;
    this.category = category;
  }
}

export class QvaPayTransientError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "QvaPayTransientError";
  }
}

export interface QvaPayP2PClientOptions {
  readonly baseUrl: string;
  readonly fetcher?: typeof fetch;
  readonly take?: number;
  readonly maxRetries?: number;
  readonly sleep?: (milliseconds: number) => Promise<void>;
}

const OFFER_TYPES = ["buy", "sell"] as const;

export class QvaPayP2PClient {
  private readonly fetcher: typeof fetch;
  private readonly take: number;
  private readonly maxRetries: number;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(private readonly options: QvaPayP2PClientOptions) {
    this.fetcher = options.fetcher ?? fetch;
    this.take = options.take ?? 100;
    this.maxRetries = options.maxRetries ?? 3;
    this.sleep =
      options.sleep ??
      ((milliseconds) =>
        new Promise((resolve) => setTimeout(resolve, milliseconds)));

    if (!Number.isInteger(this.take) || this.take < 1 || this.take > 100) {
      throw new Error("QvaPay P2P take must be between 1 and 100");
    }

    if (!Number.isInteger(this.maxRetries) || this.maxRetries < 0) {
      throw new Error("QvaPay P2P maxRetries must be a non-negative integer");
    }
  }

  async fetchOffers(
    coin: string,
    observedAt = new Date().toISOString(),
  ): Promise<readonly Offer[]> {
    const offers: Offer[] = [];

    for (const type of OFFER_TYPES) {
      offers.push(...(await this.fetchOffersByType(coin, type, observedAt)));
    }

    return offers;
  }

  private async fetchOffersByType(
    coin: string,
    type: (typeof OFFER_TYPES)[number],
    observedAt: string,
  ): Promise<readonly Offer[]> {
    const offers: Offer[] = [];
    let page = 1;
    let lastPage = 1;

    do {
      const response = await this.fetchPageWithRetry(coin, type, page);
      const payload: unknown = await response.json();
      const parsed = parseP2PPage(payload);
      lastPage = parsed.last_page;

      if (parsed.current_page !== page) {
        throw new QvaPayProviderError(
          502,
          "QvaPay P2P returned an unexpected page",
          "contract",
        );
      }

      offers.push(
        ...parsed.data.map((offer) => mapQvaPayOffer(offer, observedAt)),
      );
      page += 1;
    } while (page <= lastPage);

    return offers;
  }

  private async fetchPageWithRetry(
    coin: string,
    type: (typeof OFFER_TYPES)[number],
    page: number,
  ): Promise<Response> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const url = new URL("/p2p", this.options.baseUrl);
        url.searchParams.set("type", type);
        url.searchParams.set("coin", coin);
        url.searchParams.set("page", String(page));
        url.searchParams.set("take", String(this.take));
        url.searchParams.set("orderBy", "updated_at");
        url.searchParams.set("orderType", "desc");

        const response = await this.fetcher(url, { method: "GET" });

        if (response.status === 429) {
          if (attempt >= this.maxRetries) {
            throw new QvaPayRateLimitError(
              this.parseRetryAfter(response.headers.get("retry-after")),
            );
          }

          const retryAfterSeconds = this.parseRetryAfter(
            response.headers.get("retry-after"),
          );
          await this.sleep((retryAfterSeconds ?? 2 ** attempt) * 1000);
          continue;
        }

        if (response.status >= 500) {
          if (attempt >= this.maxRetries) {
            throw new QvaPayProviderError(
              response.status,
              `QvaPay P2P request failed with status ${response.status}`,
              "transient",
            );
          }

          await this.sleep(2 ** attempt * 1000);
          continue;
        }

        if (!response.ok) {
          const category =
            response.status === 401
              ? "authentication"
              : response.status >= 400 && response.status < 500
                ? "invalid-request"
                : "contract";
          throw new QvaPayProviderError(
            response.status,
            `QvaPay P2P request failed with status ${response.status}`,
            category,
          );
        }

        return response;
      } catch (error) {
        if (
          error instanceof QvaPayRateLimitError ||
          error instanceof QvaPayProviderError
        ) {
          throw error;
        }

        if (attempt >= this.maxRetries) {
          throw new QvaPayTransientError(
            "QvaPay P2P request failed due to a transient transport error",
            { cause: error },
          );
        }

        await this.sleep(2 ** attempt * 1000);
      }
    }
  }

  private parseRetryAfter(value: string | null): number | undefined {
    if (value === null) {
      return undefined;
    }

    const seconds = Number(value);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
  }
}
