import { describe, expect, it } from "vitest";
import {
  actionableOffersBySide,
  createMarket,
  offersBySide,
} from "../../src/domain/market.js";
import type { Offer } from "../../src/domain/offer.js";

const offer = (
  id: string,
  side: Offer["side"],
  rate: string,
  market = "BANK_CUP",
): Offer => ({
  id,
  market,
  side,
  rate,
  amount: "100",
  availableAmount: "100",
  status: "open",
  sourceTimestamp: "2026-10-04T00:00:00.000Z",
  observedAt: "2026-10-04T00:00:00.000Z",
});

describe("market domain", () => {
  it("ordena BUY por la tasa más alta y SELL por la tasa más baja", () => {
    const market = createMarket("BANK_CUP", [
      offer("sell-2", "SELL", "1200"),
      offer("buy-2", "BUY", "1150"),
      offer("sell-1", "SELL", "1000"),
      offer("buy-1", "BUY", "900"),
    ]);

    expect(offersBySide(market, "SELL").map((item) => item.id)).toEqual([
      "sell-1",
      "sell-2",
    ]);
    expect(offersBySide(market, "BUY").map((item) => item.id)).toEqual([
      "buy-2",
      "buy-1",
    ]);
  });

  it("rechaza una oferta perteneciente a otro mercado", () => {
    expect(() =>
      createMarket("BANK_CUP", [offer("wrong", "SELL", "1000", "OTHER_CUP")]),
    ).toThrow(
      "El mercado de la oferta no coincide con la identidad del mercado",
    );
  });
});


describe("accionabilidad del mercado", () => {
  it("excluye ofertas no abiertas y agotadas de las métricas de ejecución sin ocultarlas", () => {
    const market = createMarket("BANK_CUP", [
      offer("open", "BUY", "1000"),
      { ...offer("processing", "BUY", "1200"), status: "processing" },
      { ...offer("empty", "SELL", "900"), availableAmount: "0" },
      offer("sell-open", "SELL", "950"),
    ]);

    expect(offersBySide(market, "BUY").map((item) => item.id)).toEqual([
      "processing",
      "open",
    ]);
    expect(
      actionableOffersBySide(market, "BUY").map((item) => item.id),
    ).toEqual([
      "open",
    ]);
    expect(actionableOffersBySide(market, "SELL").map((item) => item.id)).toEqual([
      "sell-open",
    ]);
  });
});
