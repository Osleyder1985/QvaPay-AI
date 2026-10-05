import type { Offer } from "../../domain/offer.js";
import type { QvaPayP2POfferDto } from "./p2p-types.js";

function calculateRate(amount: string, receive: string): string {
  const qUsdAmount = Number(amount);
  const fiatAmount = Number(receive);
  if (\n    !Number.isFinite(qUsdAmount) ||\n    qUsdAmount <= 0 ||\n    !Number.isFinite(fiatAmount)\n  ) {
    throw new Error("Invalid QvaPay P2P amounts for rate calculation");
  }
  return (fiatAmount / qUsdAmount).toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
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
    sourceTimestamp: dto.updated_at ?? dto.created_at ?? observedAt,
    observedAt,
    createdAt: dto.created_at ?? dto.updated_at ?? observedAt,
    creatorUsername: dto.User?.username ?? null,
    fiatAmount: dto.receive,
  };
}
