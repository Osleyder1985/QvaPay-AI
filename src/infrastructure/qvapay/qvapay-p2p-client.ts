import type { Offer, OfferSide } from "../../domain/offer.js";
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

export class QvaPayAuthenticationError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`QvaPay P2P authentication failed with status ${status}`);
    this.name = "QvaPayAuthenticationError";
    this.status = status;
  }
}

export class QvaPayValidationError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "QvaPayValidationError";
    this.status = status;
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
  readonly maxRetries?: number;
  readonly sleep?: (milliseconds: number) => Promise<void>;
}

export class QvaPayP2PClient {
  private readonly fetcher: typeof fetch;
  private readonly take: number;
  private readonly maxRetries: number;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(private readonly options: QvaPayP2PClientOptions) {
    this.fetcher = options.fetcher ?? fetch;
    this.take = options.take ?? 100;
    this.maxRetries = options.maxRetries ?? 3;
    this.sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));

    if (!Number.isInteger(this.take) || this.take < 1 || this.take > 100) {
      throw new Error("QvaPay P2P take must be between 1 and 100");
    }
    if (!Number.isInteger(this.maxRetries) || this.maxRetries < 0 || this.maxRetries > 5) {
      throw new Error("QvaPay P2P maxRetries must be between 0 and 5");
    }
  }

  async fetchOffers(
    coin: string,
    side: OfferSide,
    observedAt = new Date().toISOString(),
  ): Promise<readonly Offer[]> {
    const offers: Offer[] = [];
    let page = 1;
    let lastPage = 1;

    do {
      const url = new URL("/p2p", this.options.baseUrl);
      url.searchParams.set("coin", coin);
      url.searchParams.set("type", side === "BUY" ? "buy" : "sell");
      url.searchParams.set("page", String(page));
      url.searchParams.set("take", String(this.take));
      url.searchParams.set("orderBy", "updated_at");
      url.searchParams.set("orderType", "desc");

      const response = await this.fetchWithRetry(url);
      const payload: unknown = await response.json();
      const parsed = parseP2PPage(payload);
      lastPage = parsed.last_page;

      if (parsed.current_page !== page) {
        throw new QvaPayProviderError(
          502,
          "QvaPay P2P returned an unexpected page",
        );
      }

      offers.push(
        ...parsed.data.map((offer) => mapQvaPayOffer(offer, observedAt)),
      );
      page += 1;
    } while (page <= lastPage);

    return offers;
  }

  private async fetchWithRetry(url: URL): Promise<Response> {
    for (let attempt = 0; ; attempt += 1) {
      const response = await this.fetcher(url, { method: "GET" });

      if (response.status === 429) {
        if (attempt >= this.maxRetries) {
          const retryAfter = this.parseRetryAfter(response);
          throw new QvaPayRateLimitError(retryAfter);
        }
        await this.sleep(this.backoffMilliseconds(response, attempt));
        continue;
      }

      if (response.status === 401 || response.status === 403) {
        throw new QvaPayAuthenticationError(response.status);
      }

      if (response.status >= 400 && response.status < 500) {
        throw new QvaPayValidationError(
          response.status,
          `QvaPay P2P request rejected with status ${response.status}`,
        );
      }

      if (response.status >= 500) {
        if (attempt >= this.maxRetries) {
          throw new QvaPayProviderError(
            response.status,
            `QvaPay P2P request failed with status ${response.status}`,
          );
        }
        await this.sleep(this.backoffMilliseconds(response, attempt));
        continue;
      }

      if (!response.ok) {
        throw new QvaPayProviderError(
          response.status,
          `QvaPay P2P request failed with status ${response.status}`,
        );
      }

      return response;
    }
  }

  private parseRetryAfter(response: Response): number | undefined {
    const value = response.headers.get("retry-after");
    if (value === null) {
      return undefined;
    }
    const seconds = Number(value);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
  }

  private backoffMilliseconds(response: Response, attempt: number): number {
    const retryAfter = this.parseRetryAfter(response);
    if (retryAfter !== undefined) {
      return retryAfter * 1000;
    }
    return Math.min(1000 * 2 ** attempt, 8000);
  }
}
