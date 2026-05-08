import { describe, expect, it } from "vitest";

import { normalizeBarcode, isPlausibleBarcode } from "./barcodes";

describe("normalizeBarcode", () => {
  it("keeps only digits from common typed and pasted barcode formats", () => {
    expect(normalizeBarcode(" 0 12345-67890 5 ")).toBe("012345678905");
    expect(normalizeBarcode("4006381333931")).toBe("4006381333931");
  });

  it("returns null when no digit barcode remains", () => {
    expect(normalizeBarcode(null)).toBeNull();
    expect(normalizeBarcode("not a barcode")).toBeNull();
    expect(normalizeBarcode("")).toBeNull();
  });
});

describe("isPlausibleBarcode", () => {
  it("accepts common UPC, EAN, and GTIN lengths", () => {
    expect(isPlausibleBarcode("01234567")).toBe(true);
    expect(isPlausibleBarcode("012345678905")).toBe(true);
    expect(isPlausibleBarcode("4006381333931")).toBe(true);
    expect(isPlausibleBarcode("00012345678905")).toBe(true);
  });

  it("rejects impossible lengths", () => {
    expect(isPlausibleBarcode("1234567")).toBe(false);
    expect(isPlausibleBarcode("123456789012345")).toBe(false);
  });
});
