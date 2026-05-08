import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchOpenFoodFactsProduct } from "./open-food-facts-api";

const originalUserAgent = process.env.OPEN_FOOD_FACTS_USER_AGENT;

describe("fetchOpenFoodFactsProduct", () => {
  afterEach(() => {
    if (originalUserAgent === undefined) {
      delete process.env.OPEN_FOOD_FACTS_USER_AGENT;
    } else {
      process.env.OPEN_FOOD_FACTS_USER_AGENT = originalUserAgent;
    }
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("requests API v2 product endpoint with narrow fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        status: 1,
        product: { code: "012345678905", product_name: "Test" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchOpenFoodFactsProduct("012345678905");

    expect(result).toEqual({
      ok: true,
      raw: { code: "012345678905", product_name: "Test" },
    });
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(
      "https://world.openfoodfacts.org/api/v2/product/012345678905.json",
    );

    const fields = new URL(url).searchParams.get("fields");
    expect(fields?.split(",")).toEqual([
      "code",
      "product_name",
      "product_name_en",
      "generic_name",
      "brands",
      "brands_en",
      "serving_size",
      "serving_quantity",
      "nutrition_data_per",
      "countries_tags",
      "main_countries_tags",
      "data_quality_errors_tags",
      "data_quality_warnings_tags",
      "obsolete",
      "nutriments",
    ]);
  });

  it("sends a HomePlate default User-Agent and disables fetch caching", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        status: 1,
        product: { code: "012345678905" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchOpenFoodFactsProduct("012345678905");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init).toMatchObject({
      cache: "no-store",
      headers: {
        "User-Agent": expect.stringContaining("HomePlate"),
      },
    });
  });

  it("uses OPEN_FOOD_FACTS_USER_AGENT when configured", async () => {
    process.env.OPEN_FOOD_FACTS_USER_AGENT = "HomePlate Tests/1.0";
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        status: 1,
        product: { code: "012345678905" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchOpenFoodFactsProduct("012345678905");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toEqual({
      "User-Agent": "HomePlate Tests/1.0",
    });
  });

  it("returns not_found for status 0 responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ status: 0 })));

    await expect(fetchOpenFoodFactsProduct("012345678905")).resolves.toEqual({
      ok: false,
      reason: "not_found",
    });
  });

  it("returns not_found when a successful payload is missing product", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ status: 1 })));

    await expect(fetchOpenFoodFactsProduct("012345678905")).resolves.toEqual({
      ok: false,
      reason: "not_found",
    });
  });

  it("returns not_found for HTTP 404 responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn(),
      }),
    );

    await expect(fetchOpenFoodFactsProduct("012345678905")).resolves.toEqual({
      ok: false,
      reason: "not_found",
    });
  });

  it("returns request_failed for non-404 non-ok responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn(),
      }),
    );

    await expect(fetchOpenFoodFactsProduct("012345678905")).resolves.toEqual({
      ok: false,
      reason: "request_failed",
    });
  });

  it("returns request_failed when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(fetchOpenFoodFactsProduct("012345678905")).resolves.toEqual({
      ok: false,
      reason: "request_failed",
    });
  });

  it("sends an abort signal and maps timeout aborts to request_failed", async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const resultPromise = fetchOpenFoodFactsProduct("012345678905");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);

    await vi.advanceTimersByTimeAsync(30_000);

    await expect(resultPromise).resolves.toEqual({
      ok: false,
      reason: "request_failed",
    });
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("returns request_failed when JSON parsing throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error("bad json")),
      }),
    );

    await expect(fetchOpenFoodFactsProduct("012345678905")).resolves.toEqual({
      ok: false,
      reason: "request_failed",
    });
  });
});

function jsonResponse(payload: unknown) {
  return {
    ok: true,
    json: async () => payload,
  };
}
