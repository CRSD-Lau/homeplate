import { describe, expect, it } from "vitest";

import {
  getBarcodeLookupKeys,
  isPlausibleBarcode,
  normalizeBarcode,
} from "./barcodes";

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

describe("getBarcodeLookupKeys", () => {
  it("adds the leading-zero EAN-13 form for UPC-A barcodes", () => {
    expect(getBarcodeLookupKeys("049000028904")).toEqual([
      "049000028904",
      "0049000028904",
    ]);
  });

  it("adds the stripped UPC-A form for leading-zero EAN-13 barcodes", () => {
    expect(getBarcodeLookupKeys("0049000028904")).toEqual([
      "0049000028904",
      "049000028904",
    ]);
  });

  it("does not duplicate keys when the alternate form matches the exact form", () => {
    expect(getBarcodeLookupKeys("0000000000000")).toEqual([
      "0000000000000",
      "000000000000",
    ]);
  });

  it("returns no keys when no digits remain", () => {
    expect(getBarcodeLookupKeys("not a barcode")).toEqual([]);
  });
});
