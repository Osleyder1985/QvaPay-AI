import { describe, expect, it } from "vitest";
import {
  parseP2PPage,
  QvaPayContractError,
} from "../../src/infrastructure/qvapay/p2p-contract.js";

describe("QvaPay P2P contract", () => {
  it("validates and preserves decimal strings", () => {
    const page = parseP2PPage({
      data: [
        {
          uuid: "abc",
          type: "sell",
          coin: "BANK_CUP",
          amount: "100.00",
          receive: "105000.50",
          available_amount: "90.00",
          status: "processing",
        },
      ],
      current_page: 1,
      last_page: 1,
      per_page: 100,
      total: 1,
    });

    expect(page.data[0]?.receive).toBe("105000.50");
    expect(page.data[0]?.type).toBe("sell");
    expect(page.data[0]?.status).toBe("processing");
  });

  it("accepts serialized pagination integers from QvaPay", () => {
    const page = parseP2PPage({
      data: [
        {
          uuid: "abc",
          type: "buy",
          coin: "QUSD",
          amount: "100",
          receive: "100000",
          available_amount: "100",
        },
      ],
      current_page: "1",
      last_page: "3",
      per_page: "100",
      total: "201",
    });

    expect(page.current_page).toBe(1);
    expect(page.last_page).toBe(3);
    expect(page.per_page).toBe(100);
    expect(page.total).toBe(201);
  });

  it("rejects non-integer pagination values", () => {
    expect(() =>
      parseP2PPage({
        data: [
          {
            uuid: "abc",
            type: "sell",
            coin: "BANK_CUP",
            amount: "100",
            receive: "105000",
            available_amount: "90",
          },
        ],
        current_page: "1.5",
        last_page: 1,
        per_page: 100,
        total: 1,
      }),
    ).toThrow(QvaPayContractError);
  });

  it("derives last_page when the provider omits it", () => {
    const page = parseP2PPage({
      data: [],
      current_page: 2,
      per_page: 20,
      total: 41,
    });

    expect(page.last_page).toBe(3);
  });

  it("rejects numeric decimals instead of silently coercing them", () => {
    expect(() =>
      parseP2PPage({
        data: [
          {
            uuid: "abc",
            type: "sell",
            coin: "BANK_CUP",
            amount: 100,
            receive: "105000",
            available_amount: "90",
          },
        ],
        current_page: 1,
        last_page: 1,
        per_page: 100,
        total: 1,
      }),
    ).toThrow(QvaPayContractError);
  });
});

describe("QvaPay P2P offer status", () => {
  it("defaults public offers to open when the provider omits status", () => {
    const page = parseP2PPage({
      data: [
        {
          uuid: "open-offer",
          type: "sell",
          coin: "BANK_CUP",
          amount: "100",
          receive: "25000",
          available_amount: "100",
        },
      ],
      current_page: 1,
      last_page: 1,
      per_page: 100,
      total: 1,
    });

    expect(page.data[0]?.status).toBe("open");
  });

  it("rejects an unsupported provider status", () => {
    expect(() =>
      parseP2PPage({
        data: [
          {
            uuid: "bad-status",
            type: "sell",
            coin: "BANK_CUP",
            amount: "100",
            receive: "25000",
            available_amount: "100",
            status: "expired",
          },
        ],
        current_page: 1,
        last_page: 1,
        per_page: 100,
        total: 1,
      }),
    ).toThrow(QvaPayContractError);
  });
});
