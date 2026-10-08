/**
 * @archivo src/infrastructure/cloudflare/public-app.ts
 * @proposito Construye la interfaz pública de la aplicación.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/infrastructure/cloudflare dentro de la arquitectura de QvaPay-AI.
 */

import type { Market } from "../../domain/market.js";
import type { Offer } from "../../domain/offer.js";
import { compareDecimalStrings } from "../../domain/offer.js";
import type { ScannerSchedulerRuntimeState } from "./scanner-scheduler-do.js";
import { renderDashboardView } from "../../presentation/dashboard/dashboard-view.js";
import { DASHBOARD_STYLES } from "../../presentation/dashboard/dashboard-styles.js";
import { DASHBOARD_CLIENT_SCRIPT } from "../../presentation/dashboard/dashboard-client.js";

import {
  renderApplicationShellEnd,
  renderApplicationShellStart,
} from "./application-shell-layout.js";
import { renderApplicationShellHeader } from "./application-shell-header.js";
import {
  renderApplicationShellModuleMountEnd,
  renderApplicationShellModuleMountStart,
} from "./application-shell-module-mount.js";

const MAX_VISIBLE_OFFERS = 20;

export interface PublicMarketOffer {
  readonly id: string;
  readonly side: "BUY" | "SELL";
  readonly rate: string;
  readonly amount: string;
  readonly availableAmount: string;
  readonly status: Offer["status"];
  readonly createdAt: string;
  readonly creatorUsername: string | null;
  readonly creatorVip: boolean;
  readonly onlyVip: boolean;
  readonly fiatAmount: string;
  readonly observedAt: string;
}

export interface PublicMarketMetrics {
  readonly totalOffers: number;
  readonly buyOffers: number;
  readonly sellOffers: number;
  readonly totalAvailableAmount: string;
  readonly bestBuyRate: string | null;
  readonly bestSellRate: string | null;
  readonly spread: string | null;
  readonly spreadPercent: number | null;
  readonly crossedMarket: boolean;
  readonly snapshotAt: string | null;
}

export interface PublicScannerState {
  readonly configured: boolean;
  readonly coin: string | null;
  readonly intervalSeconds: number | null;
  readonly nextAlarmAt: number | null;
  readonly serverNowAt: number;
  readonly running: boolean;
  readonly snapshotStatus: "UNAVAILABLE" | "EMPTY" | "AVAILABLE";
  readonly lastStartedAt: string | null;
  readonly lastCompletedAt: string | null;
  readonly lastError: string | null;
  readonly metrics: PublicMarketMetrics;
  readonly buyOffers: readonly PublicMarketOffer[];
  readonly sellOffers: readonly PublicMarketOffer[];
}

function addPositiveDecimals(values: readonly string[]): string {
  const normalized = values.map((value) => {
    const [integer = "0", fraction = ""] = value.split(".");
    return { integer: integer.replace(/^0+(?=\d)/, ""), fraction };
  });
  const fractionLength = normalized.reduce(
    (max, value) => Math.max(max, value.fraction.length),
    0,
  );
  let carry = 0;
  let fraction = "";
  for (let index = fractionLength - 1; index >= 0; index -= 1) {
    let digit = carry;
    for (const value of normalized) {
      digit += Number(value.fraction[index] ?? "0");
    }
    fraction = String(digit % 10) + fraction;
    carry = Math.floor(digit / 10);
  }
  let integer = "";
  const maxIntegerLength = normalized.reduce(
    (max, value) => Math.max(max, value.integer.length),
    0,
  );
  for (let index = maxIntegerLength - 1; index >= 0; index -= 1) {
    let digit = carry;
    for (const value of normalized) {
      const position = index - (maxIntegerLength - value.integer.length);
      digit += Number(position >= 0 ? value.integer[position] : "0");
    }
    integer = String(digit % 10) + integer;
    carry = Math.floor(digit / 10);
  }
  while (carry > 0) {
    integer = String(carry % 10) + integer;
    carry = Math.floor(carry / 10);
  }
  fraction = fraction.replace(/0+$/, "");
  return fraction ? integer + "." + fraction : integer || "0";
}

function toPublicOffer(offer: Offer): PublicMarketOffer {
  return {
    id: offer.id,
    side: offer.side,
    rate: offer.rate,
    amount: offer.amount,
    availableAmount: offer.availableAmount,
    status: offer.status,
    createdAt: offer.createdAt ?? offer.sourceTimestamp,
    creatorUsername: offer.creatorUsername ?? null,
    creatorVip: offer.creatorVip ?? false,
    onlyVip: offer.onlyVip ?? false,
    fiatAmount: offer.fiatAmount ?? offer.rate,
    observedAt: offer.observedAt,
  };
}

function buildMarketView(market: Market | null, completedAt: string | null) {
  if (!market) {
    return {
      metrics: {
        totalOffers: 0,
        buyOffers: 0,
        sellOffers: 0,
        totalAvailableAmount: "0",
        bestBuyRate: null,
        bestSellRate: null,
        spread: null,
        spreadPercent: null,
        crossedMarket: false,
        snapshotAt: null,
      } satisfies PublicMarketMetrics,
      buyOffers: [] as PublicMarketOffer[],
      sellOffers: [] as PublicMarketOffer[],
    };
  }

  const buy = market.offers
    .filter((offer) => offer.side === "BUY")
    .sort((left, right) => compareDecimalStrings(right.rate, left.rate));
  const sell = market.offers
    .filter((offer) => offer.side === "SELL")
    .sort((left, right) => compareDecimalStrings(left.rate, right.rate));
  const bestBuy = buy[0]?.rate ?? null;
  const bestSell = sell[0]?.rate ?? null;
  const crossedMarket =
    bestBuy !== null &&
    bestSell !== null &&
    compareDecimalStrings(bestBuy, bestSell) > 0;
  const bestBuyNumber = bestBuy === null ? null : Number(bestBuy);
  const bestSellNumber = bestSell === null ? null : Number(bestSell);
  const spread =
    bestBuyNumber !== null && bestSellNumber !== null
      ? (bestSellNumber - bestBuyNumber)
          .toFixed(8)
          .replace(/0+$/, "")
          .replace(/\.$/, "")
      : null;
  const spreadPercent =
    bestBuyNumber !== null &&
    bestBuyNumber !== 0 &&
    bestSellNumber !== null
      ? ((bestSellNumber - bestBuyNumber) / bestBuyNumber) * 100
      : null;

  return {
    metrics: {
      totalOffers: market.offers.length,
      buyOffers: buy.length,
      sellOffers: sell.length,
      totalAvailableAmount: addPositiveDecimals(
        market.offers.map((offer) => offer.availableAmount),
      ),
      bestBuyRate: bestBuy,
      bestSellRate: bestSell,
      spread,
      spreadPercent,
      crossedMarket,
      snapshotAt: completedAt,
    } satisfies PublicMarketMetrics,
    buyOffers: buy.slice(0, MAX_VISIBLE_OFFERS).map(toPublicOffer),
    sellOffers: sell.slice(0, MAX_VISIBLE_OFFERS).map(toPublicOffer),
  };
}

/**
 * @proposito API pública toPublicScannerState: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar el contrato y las validaciones correspondientes a la integración.
 * @returns Resultado de la operación pública.
 */
export function toPublicScannerState(
  state: ScannerSchedulerRuntimeState,
): PublicScannerState {
  const marketView = buildMarketView(
    state.market,
    state.execution.lastCompletedAt,
  );
  const snapshotStatus =
    state.market === null
      ? "UNAVAILABLE"
      : state.market.offers.length === 0
        ? "EMPTY"
        : "AVAILABLE";

  return {
    configured: state.configured,
    coin: state.coin,
    intervalSeconds: state.intervalSeconds,
    nextAlarmAt: state.nextAlarmAt,
    serverNowAt: Date.now(),
    running:
      state.execution.lastStartedAt !== null &&
      (state.execution.lastCompletedAt === null ||
        state.execution.lastStartedAt > state.execution.lastCompletedAt),
    lastStartedAt: state.execution.lastStartedAt,
    lastCompletedAt: state.execution.lastCompletedAt,
    lastError: state.execution.lastError,
    snapshotStatus,
    ...marketView,
  };
}

const HTML = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="QvaPay-AI · Dashboard operativo P2P con observabilidad, control y trazabilidad">
<title>QvaPay-AI · Dashboard</title>
${DASHBOARD_STYLES}
</head>
${renderApplicationShellStart()}
${renderApplicationShellHeader()}
${renderApplicationShellModuleMountStart()}
${renderDashboardView()}
${renderApplicationShellModuleMountEnd()}
${renderApplicationShellEnd()}
${DASHBOARD_CLIENT_SCRIPT}
</body></html>`

/**
 * @proposito API pública createPublicAppResponse: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar el contrato y las validaciones correspondientes a la integración.
 * @returns Resultado de la operación pública.
 */
export function createPublicAppResponse(): Response {
  return new Response(HTML, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}

/**
 * @proposito API pública createPublicScannerStateResponse: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar el contrato y las validaciones correspondientes a la integración.
 * @returns Resultado de la operación pública.
 */
export function createPublicScannerStateResponse(
  state: PublicScannerState,
): Response {
  return Response.json(state, {
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
