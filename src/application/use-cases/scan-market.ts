import { createMarket } from "../../domain/market.js";
import type { OfferSide } from "../../domain/offer.js";
import type { MarketProvider } from "../ports/market-provider.js";

const MARKET_SIDES: readonly OfferSide[] = ["BUY", "SELL"];

export async function scanMarket(
  provider: MarketProvider,
  coin: string,
): Promise<ReturnType<typeof createMarket>> {
  const offers = (
    await Promise.all(
      MARKET_SIDES.map((side) => provider.fetchOffers(coin, side)),
    )
  ).flat();

  return createMarket(
    coin,
    offers.filter((offer) => offer.market === coin),
  );
}
