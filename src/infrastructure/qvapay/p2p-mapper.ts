/**
 * @archivo src/infrastructure/qvapay/p2p-mapper.ts
 * @proposito Transforma respuestas P2P externas al modelo interno.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/infrastructure/qvapay dentro de la arquitectura de QvaPay-AI.
 */

import type { Offer } from "../../domain/offer.js";
import type { QvaPayP2POfferDto } from "./p2p-types.js";

function calculateRate(amount: string, receive: string): string {
  const qUsdAmount = Number(amount);
  const fiatAmount = Number(receive);
  if (
    !Number.isFinite(qUsdAmount) ||
    qUsdAmount <= 0 ||
    !Number.isFinite(fiatAmount)
  ) {
    throw new Error(
      "Las cantidades QvaPay P2P no son válidas para calcular la tasa",
    );
  }

  return (fiatAmount / qUsdAmount)
    .toFixed(8)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
}

export function mapQvaPayOffer(
  dto: QvaPayP2POfferDto,
  observedAt: string,
): Offer {
  const side = dto.type === "buy" ? "BUY" : "SELL";

  return {
    id: dto.uuid,
    market: dto.coin,
    side,
    rate: calculateRate(dto.amount, dto.receive),
    amount: dto.amount,
    availableAmount: dto.available_amount,
    status: dto.status ?? "open",
    sourceTimestamp: dto.updated_at ?? dto.created_at ?? observedAt,
    observedAt,
    createdAt: dto.created_at ?? dto.updated_at ?? observedAt,
    creatorUsername: dto.User?.username ?? null,
    creatorVip: dto.User?.vip ?? false,
    onlyVip: dto.only_vip ?? false,
    fiatAmount: dto.receive,
  };
}
