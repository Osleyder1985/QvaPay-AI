import { describe, expect, it } from "vitest";
import { compareDecimalStrings } from "../../src/domain/offer.js";

describe("decimal comparison", () => {
  it("compares decimal strings without binary floating point", () => {
    expect(compareDecimalStrings("1000.10", "1000.2")).toBeLessThan(0);
    expect(compareDecimalStrings("1000.20", "1000.2")).toBe(0);
    expect(compareDecimalStrings("2", "10")).toBeLessThan(0);
  });

  it("supports negative decimal values", () => {
    expect(compareDecimalStrings("-2", "-1")).toBeLessThan(0);
    expect(compareDecimalStrings("-1", "0")).toBeLessThan(0);
  });
});
