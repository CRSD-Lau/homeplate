import { describe, expect, it } from "vitest";

import {
  createImportSummary,
  recordImportResult,
  resolveOpenFoodFactsConfidenceStatus,
} from "./open-food-facts-import";

describe("Open Food Facts import summary", () => {
  it("counts imported and skipped products by reason", () => {
    const summary = createImportSummary();

    recordImportResult(summary, { ok: true, barcode: "012345678905" });
    recordImportResult(summary, { ok: false, reason: "missing_serving" });
    recordImportResult(summary, { ok: false, reason: "missing_serving" });
    recordImportResult(summary, { ok: false, reason: "quality_errors" });

    expect(summary).toEqual({
      seen: 4,
      accepted: 1,
      skipped: 3,
      skipReasons: {
        missing_serving: 2,
        quality_errors: 1,
      },
      warnings: {},
    });
  });

  it("counts accepted product warnings", () => {
    const summary = createImportSummary();

    recordImportResult(summary, {
      ok: true,
      barcode: "012345678905",
      warnings: ["en:nutrition-value-over-105", "en:nutrition-value-over-105"],
    });
    recordImportResult(summary, {
      ok: true,
      barcode: "4006381333931",
      warnings: ["en:serving-size-missing-unit"],
    });

    expect(summary).toEqual({
      seen: 2,
      accepted: 2,
      skipped: 0,
      skipReasons: {},
      warnings: {
        "en:nutrition-value-over-105": 2,
        "en:serving-size-missing-unit": 1,
      },
    });
  });
});

describe("resolveOpenFoodFactsConfidenceStatus", () => {
  it("keeps imported confidence from downgrading to provisional", () => {
    expect(
      resolveOpenFoodFactsConfidenceStatus("imported", "provisional"),
    ).toBe("imported");
  });

  it("allows provisional confidence to upgrade to imported", () => {
    expect(
      resolveOpenFoodFactsConfidenceStatus("provisional", "imported"),
    ).toBe("imported");
  });

  it("uses incoming confidence for new rows", () => {
    expect(resolveOpenFoodFactsConfidenceStatus(null, "provisional")).toBe(
      "provisional",
    );
  });

  it("preserves manual confidence", () => {
    expect(resolveOpenFoodFactsConfidenceStatus("manual", "imported")).toBe(
      "manual",
    );
  });

  it("preserves verified confidence", () => {
    expect(resolveOpenFoodFactsConfidenceStatus("verified", "imported")).toBe(
      "verified",
    );
  });
});
