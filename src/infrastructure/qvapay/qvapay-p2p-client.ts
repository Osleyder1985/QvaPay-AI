/**
 * @archivo src/infrastructure/qvapay/qvapay-p2p-client.ts
 * @proposito Consulta ofertas P2P de QvaPay y aplica sus reglas de acceso.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
* @dependencias API P2P de QvaPay, p2p-contract.ts, p2p-mapper.ts y modelo Offer.
* @seguridad Usa credenciales de aplicación para integración P2P y debe preservar la política de reintentos y límites.
* @superficie-publica QvaPayP2PClient y categorías/errores de integración exportados.
* @mantenimiento Mantener alineado con docs/integration/qvapay-p2p-api-contract.md y docs/integration/qvapay-p2p-feed-contract.md.
 * @ubicacion src/infrastructure/qvapay dentro de la arquitectura de QvaPay-AI.
 */

import type { Offer } from "../../domain/offer.js";
import { mapQvaPayOffer } from "./p2p-mapper.js";
import { parseP2PPage } from "./p2p-contract.js";

/**
 * @proposito API pública QvaPayRateLimitError: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar el contrato y las validaciones correspondientes a la integración.
 */
export class QvaPayRateLimitError extends Error {
  readonly retryAfterSeconds: number | undefined;

  constructor(retryAfterSeconds: number | undefined) {
    super("QvaPay P2P rate limit exceeded");
    this.name = "QvaPayRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export type QvaPayProviderErrorCategory =
  "invalid-request" | "authentication" | "transient" | "contract";

/**
 * @proposito API pública QvaPayProviderError: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar el contrato y las validaciones correspondientes a la integración.
 */
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

/**
 * @proposito API pública QvaPayTransientError: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar el contrato y las validaciones correspondientes a la integración.
 */
export class QvaPayTransientError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "QvaPayTransientError";
  }
}

export interface QvaPayP2PClientOptions {
  readonly baseUrl: string;
  readonly appId: string;
  readonly appSecret: string;
  readonly fetcher?: typeof fetch;
  readonly take?: number;
  readonly maxRetries?: number;
  readonly timeoutMs?: number;
  readonly sleep?: (milliseconds: number) => Promise<void>;
}

const OFFER_TYPES = ["buy", "sell"] as const;

const defaultSleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function describeTransportError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

/**
 * @proposito API pública QvaPayP2PClient: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar el contrato y las validaciones correspondientes a la integración.
 */
export class QvaPayP2PClient {
  private readonly fetcher: typeof fetch;
  private readonly take: number;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(private readonly options: QvaPayP2PClientOptions) {
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
    this.take = options.take ?? 100;
    this.maxRetries = options.maxRetries ?? 3;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.sleep = options.sleep ?? defaultSleep;

    if (!options.appId || !options.appSecret) {
      throw new Error(
        "Las credenciales de la aplicación QvaPay P2P son obligatorias",
      );
    }

    if (!Number.isInteger(this.take) || this.take < 1 || this.take > 100) {
      throw new Error("QvaPay P2P take debe estar entre 1 y 100");
    }

    if (!Number.isInteger(this.maxRetries) || this.maxRetries < 0) {
      throw new Error("QvaPay P2P maxRetries debe ser un entero no negativo");
    }

    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new Error("QvaPay P2P timeoutMs debe ser un entero positivo");
    }
  }

  async applyOffer(uuid: string): Promise<unknown> {
    const response = await this.fetcher(
      new URL(`/p2p/${encodeURIComponent(uuid)}/apply`, this.options.baseUrl),
      {
        method: "POST",
        headers: {
          "app-id": this.options.appId,
          "app-secret": this.options.appSecret,
        },
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new QvaPayProviderError(
        response.status,
        body || `QvaPay P2P apply failed with status ${response.status}`,
        response.status === 401
          ? "authentication"
          : response.status >= 400 && response.status < 500
            ? "invalid-request"
            : "transient",
      );
    }

    return response.json();
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

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
          const response = await this.fetcher(url, {
            method: "GET",
            headers: {
              "app-id": this.options.appId,
              "app-secret": this.options.appSecret,
            },
            signal: controller.signal,
          });

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
        } finally {
          clearTimeout(timeout);
        }
      } catch (error) {
        if (
          error instanceof QvaPayRateLimitError ||
          error instanceof QvaPayProviderError
        ) {
          throw error;
        }

        if (attempt >= this.maxRetries) {
          throw new QvaPayTransientError(
            `QvaPay P2P ${type} page ${page} transport error: ${describeTransportError(error)}`,
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
