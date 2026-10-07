import { describe, expect, it } from "vitest";
import { mapQvaPayOffer } from "../../src/infrastructure/qvapay/p2p-mapper.js";

describe("QvaPay P2P mapper", () => {
  it("calcula la proporción efectiva CUP por QUSD y conserva los detalles de la oferta", () => {
    const offer = mapQvaPayOffer(
      {
        uuid: "offer-1",
        type: "sell",
        coin: "BANK_CUP",
        amount: "100",
        receive: "25000",
        available_amount: "80",
        status: "processing",
        created_at: "2026-10-05T15:00:00.000Z",
        updated_at: "2026-10-05T15:01:00.000Z",
        User: { username: "trader123" },
      },
      "2026-10-05T15:02:00.000Z",
    );

    expect(offer.rate).toBe("250");
    expect(offer.amount).toBe("100");
    expect(offer.availableAmount).toBe("80");
    expect(offer.status).toBe("processing");
    expect(offer.fiatAmount).toBe("25000");
    expect(offer.createdAt).toBe("2026-10-05T15:00:00.000Z");
    expect(offer.creatorUsername).toBe("trader123");
  });

  it("no clasifica los totales brutos de CUP como la tasa", () => {
    const small = mapQvaPayOffer(
      {
        uuid: "small",
        type: "buy",
        coin: "BANK_CUP",
        amount: "10",
        receive: "2600",
        available_amount: "10",
        User: { username: "small" },
      },
      "2026-10-05T15:00:00.000Z",
    );
    const large = mapQvaPayOffer(
      {
        uuid: "large",
        type: "buy",
        coin: "BANK_CUP",
        amount: "100",
        receive: "25500",
        available_amount: "100",
        User: { username: "large" },
      },
      "2026-10-05T15:00:00.000Z",
    );

    expect(small.rate).toBe("260");
    expect(large.rate).toBe("255");
  });
});

describe("QvaPay P2P mapper VIP metadata", () => {
  it("conserva la restricción VIP de la oferta y el estado VIP del creador", () => {
    const offer = mapQvaPayOffer(
      {
        uuid: "vip-offer",
        type: "sell",
        coin: "BANK_CUP",
        amount: "500",
        receive: "505000",
        available_amount: "500",
        only_vip: true,
        User: { username: "vip-seller", vip: true },
      },
      "2026-10-05T17:00:00.000Z",
    );

    expect(offer.onlyVip).toBe(true);
    expect(offer.creatorVip).toBe(true);
  });
});
