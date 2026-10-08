/**
 * @archivo src/domain/market.ts
 * @proposito Define la identidad de un mercado y las operaciones de ordenamiento de ofertas.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @dependencias Modelo Offer y utilidades decimales del dominio.
 * @seguridad No maneja secretos ni acceso externo; aplica invariantes de identidad de mercado.
 * @superficie-publica Market, createMarket y offersBySide.
 * @mantenimiento Mantener alineado con las reglas de mercado y su documentación de requisitos.
 * @ubicacion src/domain dentro de la arquitectura de QvaPay-AI.
 */

import type { Offer, OfferSide } from "./offer.js";
import { compareDecimalStrings } from "./offer.js";

export interface Market {
  readonly coin: string;
  readonly offers: readonly Offer[];
}

/**
 * @proposito API pública createMarket: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export function createMarket(coin: string, offers: readonly Offer[]): Market {
  const normalizedCoin = coin.trim();
  if (!normalizedCoin) {
    throw new Error("La moneda del mercado es obligatoria");
  }

  for (const offer of offers) {
    if (offer.market !== normalizedCoin) {
      throw new Error(
        "El mercado de la oferta no coincide con la identidad del mercado",
      );
    }
    if (compareDecimalStrings(offer.rate, "0") <= 0) {
      throw new Error("La tasa de la oferta debe ser positiva");
    }
    if (compareDecimalStrings(offer.amount, "0") <= 0) {
      throw new Error("La cantidad de la oferta debe ser positiva");
    }
    if (compareDecimalStrings(offer.availableAmount, "0") < 0) {
      throw new Error("La cantidad disponible de la oferta no puede ser negativa");
    }
    if (
      offer.fiatAmount !== undefined &&
      compareDecimalStrings(offer.fiatAmount, "0") <= 0
    ) {
      throw new Error("El importe fiat de la oferta debe ser positivo");
    }
  }

  return {
    coin: normalizedCoin,
    offers: [...offers],
  };
}

/**
 * @proposito API pública isActionableOffer: determina si una oferta puede participar en métricas de ejecución.
 * @responsabilidades Exigir estado abierto y cantidad disponible positiva.
 * @returns true cuando la oferta es accionable; false cuando debe conservarse solo para observación.
 */
export function isActionableOffer(offer: Offer): boolean {
  return (
    offer.status === "open" &&
    compareDecimalStrings(offer.availableAmount, "0") > 0
  );
}

/**
 * @proposito Filtra ofertas que representan oportunidades actualmente accionables.
 * @responsabilidades Excluir estados no ejecutables y cantidades disponibles agotadas sin ocultarlas del snapshot.
 * @returns Ofertas elegibles para métricas de ejecución.
 */
export function actionableOffersBySide(
  market: Market,
  side: OfferSide,
): readonly Offer[] {
  return offersBySide(market, side).filter(isActionableOffer);
}

/**
 * @proposito API pública offersBySide: selecciona y ordena las ofertas de un lado del mercado.
 * @responsabilidades Mantener BUY y SELL separados y aplicar su orden de tasa específico.
 * @returns Ofertas del lado solicitado ordenadas por tasa según la semántica del mercado.
 */
export function offersBySide(
  market: Market,
  side: OfferSide,
): readonly Offer[] {
  return market.offers
    .filter((offer) => offer.side === side)
    .sort((left, right) => {
      const comparison = compareDecimalStrings(left.rate, right.rate);
      return side === "BUY" ? -comparison : comparison;
    });
}
