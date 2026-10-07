/**
 * @archivo src/application/use-cases/scan-market.ts
 * @proposito Ejecuta el caso de uso de lectura y validación de un mercado.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/application/use-cases dentro de la arquitectura de QvaPay-AI.
 */

import { createMarket } from "../../domain/market.js";
import type { MarketProvider } from "../ports/market-provider.js";

export async function scanMarket(
  provider: MarketProvider,
  coin: string,
): Promise<ReturnType<typeof createMarket>> {
  const offers = await provider.fetchOffers(coin);
  return createMarket(
    coin,
    offers.filter((offer) => offer.market === coin),
  );
}
