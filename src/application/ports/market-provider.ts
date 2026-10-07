/**
 * @archivo src/application/ports/market-provider.ts
 * @proposito Define el puerto de acceso a ofertas de mercado.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/application/ports dentro de la arquitectura de QvaPay-AI.
 */

import type { Offer } from "../../domain/offer.js";

export interface MarketProvider {
  fetchOffers(coin: string): Promise<readonly Offer[]>;
}
