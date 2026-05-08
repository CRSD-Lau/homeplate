const openFoodFactsProductFields = [
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
].join(",");

const defaultUserAgent =
  "HomePlate/0.1 private household nutrition app (https://github.com/homeplate)";
const requestTimeoutMs = 10_000;

export type OpenFoodFactsApiResult =
  | { ok: true; raw: Record<string, unknown> }
  | { ok: false; reason: "not_found" | "request_failed" };

export async function fetchOpenFoodFactsProduct(
  barcode: string,
): Promise<OpenFoodFactsApiResult> {
  const userAgent =
    process.env.OPEN_FOOD_FACTS_USER_AGENT?.trim() || defaultUserAgent;
  const url = new URL(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      barcode,
    )}.json`,
  );
  url.searchParams.set("fields", openFoodFactsProductFields);

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        "User-Agent": userAgent,
      },
      signal: abortController.signal,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { ok: false, reason: "not_found" };
      }
      return { ok: false, reason: "request_failed" };
    }

    const payload = (await response.json()) as {
      status?: unknown;
      product?: unknown;
    };

    if (payload.status !== 1 || !isRecord(payload.product)) {
      return { ok: false, reason: "not_found" };
    }

    return { ok: true, raw: payload.product };
  } catch {
    return { ok: false, reason: "request_failed" };
  } finally {
    clearTimeout(timeoutId);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
