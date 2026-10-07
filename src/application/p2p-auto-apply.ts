/**
 * Propósito: Reglas puras de selección para Auto Apply BUY/SELL.
 * Ubicación: src/application/p2p-auto-apply.ts
 * Funciones principales: normaliza configuración y selecciona candidatos sin realizar llamadas externas.
 * Historial: 2026-10-06 — implementación inicial para Issue #222.
 */

import type { Offer } from "../domain/offer.js";
import { compareDecimalStrings } from "../domain/offer.js";

export interface AutoApplyConfig {
  readonly enabled: boolean;
  readonly buy: {
    readonly maxRate: string;
    readonly maxCupAmount: string;
  };
  readonly sell: {
    readonly minRate: string;
  };
}

export interface AutoApplyBalance {
  readonly qusd: string;
}

export interface AutoApplyCandidate {
  readonly action: "BUY" | "SELL";
  readonly offer: Offer;
}

function requireDecimal(value: string, field: string): string {
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) {
    throw new Error(`Invalid Auto Apply decimal: ${field}`);
  }
  return value;
}

export function normalizeAutoApplyConfig(config: AutoApplyConfig): AutoApplyConfig {
  return {
    enabled: Boolean(config.enabled),
    buy: {
      maxRate: requireDecimal(config.buy.maxRate, "buy.maxRate"),
      maxCupAmount: requireDecimal(config.buy.maxCupAmount, "buy.maxCupAmount"),
    },
    sell: {
      minRate: requireDecimal(config.sell.minRate, "sell.minRate"),
    },
  };
}

export function findAutoApplyCandidate(
  offers: readonly Offer[],
  config: AutoApplyConfig,
  balance: AutoApplyBalance | null,
): AutoApplyCandidate | null {
  const normalized = normalizeAutoApplyConfig(config);
  if (!normalized.enabled) return null;

  const buyCandidate = offers
    .filter(
      (offer) =>
        offer.side === "SELL" &&
        offer.status === "open" &&
        compareDecimalStrings(offer.rate, normalized.buy.maxRate) < 0 &&
        compareDecimalStrings(offer.fiatAmount ?? "0", normalized.buy.maxCupAmount) <= 0,
    )
    .sort((a, b) => compareDecimalStrings(a.rate, b.rate))[0];

  if (buyCandidate) return { action: "BUY", offer: buyCandidate };

  const sellCandidate = offers
    .filter(
      (offer) =>
        offer.side === "BUY" &&
        offer.status === "open" &&
        compareDecimalStrings(offer.rate, normalized.sell.minRate) > 0 &&
        compareDecimalStrings(offer.amount, balance.qusd) <= 0,
    )
    .sort((a, b) => compareDecimalStrings(b.rate, a.rate))[0];

  return sellCandidate ? { action: "SELL", offer: sellCandidate } : null;
}
