/**
 * @archivo src/application/p2p-auto-apply-decision.ts
 * @proposito Evaluar de forma determinista si una oferta satisface una estrategia Auto Apply.
 * @responsabilidades Aplicar criterios BUY/SELL y condiciones de seguridad sin ejecutar operaciones ni acceder a credenciales.
 * @dependencias Modelo Offer y comparación decimal del dominio.
 * @seguridad Fallar de forma cerrada ante configuración, balance, snapshot o elegibilidad no verificables.
 * @superficie-publica AutoApplyDecisionInput, AutoApplyDecision, evaluateAutoApplyDecision.
 * @mantenimiento Mantener los criterios alineados con el Issue #222 y probar cada motivo de rechazo.
 * @ubicacion Capa de aplicación de operaciones P2P.
 */
import type { Offer, OfferSide } from "../domain/offer.js";
import { compareDecimalStrings } from "../domain/offer.js";

export interface AutoApplyDecisionInput {
  readonly enabled: boolean;
  readonly action: OfferSide;
  readonly offer: Offer;
  readonly expectedCoin: string;
  readonly rateThreshold: string;
  readonly amountLimit: string;
  readonly nowMs: number;
  readonly maxSnapshotAgeMs: number;
  readonly accountEligible: boolean;
  readonly accountBalanceQusd?: {
    readonly available: boolean;
    readonly fresh: boolean;
    readonly amount: string;
  } | null;
}
export type AutoApplyDecision =
  | { readonly eligible: true; readonly action: OfferSide; readonly offerUuid: string }
  | { readonly eligible: false; readonly reason:
      | "DISABLED" | "INVALID_CONFIGURATION" | "ACCOUNT_NOT_VERIFIED"
      | "MARKET_MISMATCH" | "OFFER_NOT_OPEN" | "SNAPSHOT_STALE" | "VIP_REQUIRED"
      | "BUY_RATE_NOT_BELOW_THRESHOLD" | "BUY_CUP_LIMIT_EXCEEDED"
      | "SELL_RATE_NOT_ABOVE_THRESHOLD" | "SELL_QUSD_LIMIT_EXCEEDED"
      | "SELL_BALANCE_UNAVAILABLE" };

/**
 * @proposito Evaluar una oferta para Auto Apply sin realizar efectos secundarios.
 * @responsabilidades Validar precondiciones, frescura y límites decimales de la estrategia.
 * @param input Configuración y evidencia del snapshot/cuenta usados en la decisión.
 * @returns Decisión elegible o motivo estable de exclusión para auditoría.
 */
export function evaluateAutoApplyDecision(input: AutoApplyDecisionInput): AutoApplyDecision {
  if (!input.enabled) return { eligible: false, reason: "DISABLED" };
  try {
    if (!input.expectedCoin.trim() || !input.offer.id.trim() ||
      compareDecimalStrings(input.rateThreshold, "0") <= 0 ||
      compareDecimalStrings(input.amountLimit, "0") <= 0 ||
      !Number.isFinite(input.nowMs) || !Number.isFinite(input.maxSnapshotAgeMs) ||
      input.maxSnapshotAgeMs <= 0) return { eligible: false, reason: "INVALID_CONFIGURATION" };
  } catch { return { eligible: false, reason: "INVALID_CONFIGURATION" }; }
  if (!input.accountEligible) return { eligible: false, reason: "ACCOUNT_NOT_VERIFIED" };
  if (input.offer.market !== input.expectedCoin) return { eligible: false, reason: "MARKET_MISMATCH" };
  if (input.offer.status !== "open" || compareDecimalStrings(input.offer.availableAmount, "0") <= 0)
    return { eligible: false, reason: "OFFER_NOT_OPEN" };
  const observedAt = Date.parse(input.offer.observedAt);
  if (!Number.isFinite(observedAt) || observedAt > input.nowMs ||
      input.nowMs - observedAt > input.maxSnapshotAgeMs)
    return { eligible: false, reason: "SNAPSHOT_STALE" };
  if (input.offer.onlyVip && input.offer.creatorVip !== true)
    return { eligible: false, reason: "VIP_REQUIRED" };
  try {
    if (input.action === "BUY") {
      if (input.offer.side !== "BUY" || compareDecimalStrings(input.offer.rate, input.rateThreshold) >= 0)
        return { eligible: false, reason: "BUY_RATE_NOT_BELOW_THRESHOLD" };
      if (input.offer.fiatAmount === undefined ||
          compareDecimalStrings(input.offer.fiatAmount, input.amountLimit) > 0)
        return { eligible: false, reason: "BUY_CUP_LIMIT_EXCEEDED" };
    } else {
      if (input.offer.side !== "SELL" || compareDecimalStrings(input.offer.rate, input.rateThreshold) <= 0)
        return { eligible: false, reason: "SELL_RATE_NOT_ABOVE_THRESHOLD" };
      const balance = input.accountBalanceQusd;
      if (!balance?.available || !balance.fresh)
        return { eligible: false, reason: "SELL_BALANCE_UNAVAILABLE" };
      if (compareDecimalStrings(input.offer.amount, input.amountLimit) > 0 ||
          compareDecimalStrings(input.offer.amount, balance.amount) > 0)
        return { eligible: false, reason: "SELL_QUSD_LIMIT_EXCEEDED" };
    }
  } catch { return { eligible: false, reason: "INVALID_CONFIGURATION" }; }
  return { eligible: true, action: input.action, offerUuid: input.offer.id };
}
