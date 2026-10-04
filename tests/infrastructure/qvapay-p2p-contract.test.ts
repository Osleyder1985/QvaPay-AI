import { describe, expect, it } from "vitest";
import { parseP2PPage, QvaPayContractError } from "../../src/infrastructure/qvapay/p2p-contract.js";

describe("QvaPay P2P contract", () => {
  it("validates and preserves decimal strings", () => {
    const page = parseP2PPage({
      data: [{
        uuid: "abc",
        type: "sell",
        coin: "BANK_CUP",
        amount: "100.00",
        receive: "105000.50",
        available_amount: "90.00",
      }],
      current_page: 1,
      last_page: 1,
      per_page: 100,
      total: 1,
    });

    expect(page.data[0]?.receive).toBe("105000.50");
    expect(page.data[0]?.type).toBe("sell");
  });

  it("rejects numeric decimals instead of silently coercing them", () => {
    expect(() => parseP2PPage({
      data: [{
        uuid: "abc",
        type: "sell",
        coin: "BANK_CUP",
        amount: 100,
        receive: "105000",
        available_amount: "90",
      }],
      current_page: 1,
      last_page: 1,
      per_page: 100,
      total: 1,
    })).toThrow(QvaPayContractError);
  });
});