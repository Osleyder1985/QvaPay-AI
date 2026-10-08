import { describe, expect, it } from "vitest";

import {
  parseP2PPage,
  QvaPayContractError,
} from "../../src/infrastructure/qvapay/p2p-contract.js";
import { mapQvaPayOffer } from "../../src/infrastructure/qvapay/p2p-mapper.js";
import { createMarket } from "../../src/domain/market.js";

const base = {
  uuid: "x",
  type: "sell" as const,
  coin: "BANK_CUP",
  amount: "100",
  receive: "25000",
  available_amount: "100",
};

describe("invariantes financieras P2P", () => {
  for (const field of ["amount", "receive"]) {
    it(`rechaza ${field}=0`, () => {
      expect(() =>
        parseP2PPage({
          data: [{ ...base, [field]: "0" }],
          current_page: 1,
          last_page: 1,
          per_page: 100,
          total: 1,
        }),
      ).toThrow(QvaPayContractError);
    });

    it(`rechaza ${field} negativo`, () => {
      expect(() =>
        parseP2PPage({
          data: [{ ...base, [field]: "-1" }],
          current_page: 1,
          last_page: 1,
          per_page: 100,
          total: 1,
        }),
      ).toThrow(QvaPayContractError);
    });
  }

  it("acepta available_amount=0 como dato no accionable", () => {
    const page = parseP2PPage({
      data: [{ ...base, available_amount: "0" }],
      current_page: 1,
      last_page: 1,
      per_page: 100,
      total: 1,
    });
    expect(page.data[0]?.available_amount).toBe("0");
  });

  it("rechaza available_amount negativo", () => {
    expect(() =>
      parseP2PPage({
        data: [{ ...base, available_amount: "-1" }],
        current_page: 1,
        last_page: 1,
        per_page: 100,
        total: 1,
      }),
    ).toThrow(QvaPayContractError);
  });

  it("acepta cantidades positivas pequeñas", () => {
    const page = parseP2PPage({
      data: [
        {
          ...base,
          amount: "0.000001",
          receive: "0.000002",
          available_amount: "0.000001",
        },
      ],
      current_page: 1,
      last_page: 1,
      per_page: 100,
      total: 1,
    });
    expect(page.data[0]?.amount).toBe("0.000001");
  });

  it("rechaza receive no positivo también al mapear", () => {
    expect(() =>
      mapQvaPayOffer({ ...base, receive: "0" }, "2026-10-08T00:00:00Z"),
    ).toThrow();
  });

  it("el dominio rechaza una oferta con tasa o cantidad no positiva", () => {
    const offer = {
      id: "x",
      market: "BANK_CUP",
      side: "SELL" as const,
      rate: "0",
      amount: "100",
      availableAmount: "100",
      status: "open" as const,
      sourceTimestamp: "2026-10-08T00:00:00Z",
      observedAt: "2026-10-08T00:00:00Z",
    };
    expect(() => createMarket("BANK_CUP", [offer])).toThrow();
  });
});
