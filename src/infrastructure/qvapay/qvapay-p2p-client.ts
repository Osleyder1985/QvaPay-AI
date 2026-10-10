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

/**
 * @proposito Representar una aplicación P2P cuyo resultado remoto no puede confirmarse.
 * @responsabilidades Evitar que un timeout o fallo de transporte se interprete como rechazo
 * y obligar a reconciliar el estado antes de permitir un nuevo intento.
 */
export class QvaPayAmbiguousOperationError extends Error {
  readonly offerUuid: string;

  constructor(
    offerUuid: string,
    message = "No se pudo confirmar el resultado de la aplicación P2P; requiere reconciliación antes de reintentar.",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "QvaPayAmbiguousOperationError";
    this.offerUuid = offerUuid;
  }
}

export interface QvaPayP2PClientOptions {
  readonly baseUrl: string;
  readonly appId: string;
  readonly appSecret: string;
  readonly userApiToken?: string;
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

  /**
   * @proposito Aplicar una oferta P2P sin repetir automáticamente una operación ambigua.
   * @responsabilidades Limitar el tiempo de la solicitud y lectura de respuesta; clasificar
   * timeout, fallo de transporte o respuesta 5xx como resultado ambiguo para reconciliación.
   * @param uuid Identificador de la oferta QvaPay.
   * @returns Respuesta JSON confirmada por QvaPay.
   * @throws QvaPayProviderError Cuando QvaPay rechaza explícitamente la solicitud.
   * @throws QvaPayAmbiguousOperationError Cuando no se puede confirmar el resultado remoto.
   */
  async applyOffer(uuid: string): Promise<unknown> {
    return this.withTimeout(
      async (signal) => {
        const response = await this.fetcher(
          new URL(
            "/p2p/" + encodeURIComponent(uuid) + "/apply",
            this.options.baseUrl,
          ),
          {
            method: "POST",
            headers: {
              "app-id": this.options.appId,
              "app-secret": this.options.appSecret,
            },
            signal,
          },
        );

        if (!response.ok) {
          if (response.status >= 500) {
            throw new QvaPayAmbiguousOperationError(
              uuid,
              "QvaPay respondió HTTP " +
                response.status +
                " a la aplicación; el resultado requiere reconciliación.",
            );
          }
          const body = await response.text();
          throw new QvaPayProviderError(
            response.status,
            body ||
              "QvaPay P2P rechazó la aplicación con estado HTTP " +
                response.status,
            response.status === 401
              ? "authentication"
              : response.status >= 400 && response.status < 500
                ? "invalid-request"
                : "transient",
          );
        }

        try {
          return await response.json();
        } catch (error) {
          throw new QvaPayAmbiguousOperationError(
            uuid,
            "QvaPay aceptó la solicitud, pero no se pudo interpretar la respuesta; requiere reconciliación.",
            { cause: error },
          );
        }
      },
      () =>
        new QvaPayAmbiguousOperationError(
          uuid,
          "Tiempo de espera agotado al aplicar la oferta; no se debe reintentar sin reconciliar el estado.",
        ),
    ).catch((error: unknown) => {
      if (
        error instanceof QvaPayProviderError ||
        error instanceof QvaPayAmbiguousOperationError
      ) {
        throw error;
      }
      throw new QvaPayAmbiguousOperationError(
        uuid,
        "Falló el transporte durante la aplicación; el resultado remoto es ambiguo y requiere reconciliación.",
        { cause: error },
      );
    });
  }

  /**
   * @proposito Recuperar el detalle autoritativo de una oferta para reconciliar una aplicación.
   * @responsabilidades Consultar mediante token de cuenta server-side; nunca repetir la mutación
   * apply cuando el detalle no esté disponible.
   * @param uuid Identificador de la oferta P2P.
   * @returns Detalle mínimo validado para conocer la oferta y su estado remoto.
   * @throws QvaPayTransientError Cuando la consulta no puede completarse o el contrato no es válido.
   */
  async fetchOfferDetail(uuid: string): Promise<{
    readonly uuid: string;
    readonly status: string;
    readonly ownerUuid: string | null;
    readonly peerUuid: string | null;
  }> {
    const token = this.options.userApiToken;
    if (!token) {
      throw new QvaPayTransientError(
        "No está configurado el token de cuenta requerido para consultar el detalle P2P.",
      );
    }

    return this.withTimeout(
      async (signal) => {
        const response = await this.fetcher(
          new URL("/p2p/" + encodeURIComponent(uuid), this.options.baseUrl),
          {
            method: "GET",
            headers: { authorization: "Bearer " + token },
            signal,
          },
        );
        if (!response.ok) {
          if (response.status >= 500 || response.status === 429) {
            throw new QvaPayTransientError(
              "QvaPay no pudo recuperar el detalle P2P (HTTP " +
                response.status +
                ").",
            );
          }
          throw new QvaPayProviderError(
            response.status,
            "QvaPay rechazó la consulta del detalle P2P (HTTP " +
              response.status +
              ").",
            response.status === 401 ? "authentication" : "invalid-request",
          );
        }

        let payload: unknown;
        try {
          payload = await response.json();
        } catch (error) {
          throw new QvaPayTransientError(
            "QvaPay devolvió un detalle P2P que no es JSON válido.",
            { cause: error },
          );
        }
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("p2p" in payload) ||
          typeof payload.p2p !== "object" ||
          payload.p2p === null
        ) {
          throw new QvaPayTransientError(
            "QvaPay devolvió un contrato de detalle P2P incompatible.",
          );
        }

        const detail = payload.p2p as Record<string, unknown>;
        if (
          detail.uuid !== uuid ||
          typeof detail.status !== "string" ||
          detail.status.trim() === ""
        ) {
          throw new QvaPayTransientError(
            "QvaPay devolvió un identificador o estado de oferta P2P incompatible.",
          );
        }
        const readParticipantUuid = (value: unknown): string | null => {
          if (value === undefined || value === null) return null;
          if (
            typeof value !== "object" ||
            value === null ||
            !("uuid" in value) ||
            typeof value.uuid !== "string" ||
            value.uuid.trim() === ""
          ) {
            throw new QvaPayTransientError(
              "QvaPay devolvió una identidad de participante P2P incompatible.",
            );
          }
          return value.uuid;
        };

        return {
          uuid,
          status: detail.status,
          ownerUuid: readParticipantUuid(detail.User),
          peerUuid: readParticipantUuid(detail.Peer),
        };
      },
      () =>
        new QvaPayTransientError(
          "Tiempo de espera agotado al recuperar el detalle P2P; la aplicación no debe repetirse.",
        ),
    );
  }

  /**
   * @proposito Ejecutar una solicitud del proveedor bajo un límite temporal estricto.
   * @responsabilidades Abortar el transporte al vencer el plazo y resolver el timeout
   * aunque el adaptador fetcher no respete la señal de aborto.
   * @param task Operación HTTP y lectura de respuesta bajo la señal de cancelación.
   * @param timeoutError Error específico que describe el resultado del timeout.
   * @returns Resultado de la tarea antes de vencer el plazo.
   */
  private async withTimeout<T>(
    task: (signal: AbortSignal) => Promise<T>,
    timeoutError: () => Error,
  ): Promise<T> {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(timeoutError());
      }, this.timeoutMs);
    });

    try {
      return await Promise.race([task(controller.signal), timeout]);
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
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
