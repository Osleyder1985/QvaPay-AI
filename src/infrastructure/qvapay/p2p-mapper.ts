import type { Offer } from "../../domain/offer.js";
import type { QvaPayP2POfferDto } from "./p2p-types.js";\n\nfunction calculateRate(amount: string, receive: string): string {\n  const qUsdAmount = Number(amount);\n  const fiatAmount = Number(receive);\n  if (!Number.isFinite(qUsdAmount) || qUsdAmount <= 0 || !Number.isFinite(fiatAmount)) {\n    throw new Error("Invalid QvaPay P2P amounts for rate calculation");\n  }\n  return (fiatAmount / qUsdAmount).toFixed(8).replace(/0+$/, "").replace(/\\.$/, "");\n}

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
