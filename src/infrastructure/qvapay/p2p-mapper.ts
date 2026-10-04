import type { Offer } from "../../domain/offer.js";
import type { QvaPayP2POfferDto } from "./p2p-types.js";

export function mapQvaPayOffer(
  dto: QvaPayP2POfferDto,
  observedAt: string,
): Offer {
  const side = dto.type === "buy" ? "BUY" : "SELL";
  return {
    id: dto.uuid,
    market: dto.coin,
    side,
    rate: dto.receive,
    amount: dto.amount,
    availableAmount: dto.available_amount,
    sourceTimestamp: dto.updated_at ?? dto.created_at ?? observedAt,
    observedAt,
  };
}