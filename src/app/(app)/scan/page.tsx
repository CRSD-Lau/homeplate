import Link from "next/link";

import {
  BarcodeFailureCard,
  BarcodeSearchForm,
  LiveBarcodeReviewCard,
  LocalBarcodeMatchCard,
} from "@/components/tracking/BarcodeLookupCard";
import { TrackingPageShell } from "@/components/tracking/TrackingPageShell";
import { getFoodsByBarcode } from "@/lib/app-data";
import { isPlausibleBarcode, normalizeBarcode } from "@/lib/barcodes";
import { fetchOpenFoodFactsProduct } from "@/lib/open-food-facts-api";
import { parseOpenFoodFactsProduct } from "@/lib/open-food-facts";

type SearchParamValue = string | string[] | undefined;

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{
    meal?: SearchParamValue;
    date?: SearchParamValue;
    barcode?: SearchParamValue;
    error?: SearchParamValue;
    saved?: SearchParamValue;
  }>;
}) {
  const rawParams = await searchParams;
  const params = {
    meal: firstSearchParam(rawParams.meal),
    date: firstSearchParam(rawParams.date),
    barcode: firstSearchParam(rawParams.barcode),
    error: firstSearchParam(rawParams.error),
    saved: firstSearchParam(rawParams.saved),
  };
  const attemptedBarcode = params.barcode !== undefined;
  const normalizedBarcode = normalizeBarcode(params.barcode);
  const hasDigits = normalizedBarcode !== null;
  const plausibleBarcode =
    normalizedBarcode !== null && isPlausibleBarcode(normalizedBarcode);
  const barcodeError =
    attemptedBarcode && !hasDigits
      ? "Enter a barcode with digits."
      : hasDigits && !plausibleBarcode
        ? "Barcode must be 8, 12, 13, or 14 digits."
        : null;
  const backHref = buildBackHref(params.meal, params.date);
  const localMatches = plausibleBarcode
    ? await getFoodsByBarcode(normalizedBarcode)
    : [];
  const liveResult =
    plausibleBarcode && localMatches.length === 0
      ? await fetchOpenFoodFactsProduct(normalizedBarcode)
      : null;
  const parsedLive =
    liveResult?.ok
      ? parseOpenFoodFactsProduct(liveResult.raw, {
          countries: ["canada", "united-states"],
        })
      : null;
  const returnTo = buildScanReturnTo(params.meal, params.date, normalizedBarcode);

  return (
    <TrackingPageShell title="Scan barcode" backHref={backHref}>
      {params.error ? <BarcodeFailureCard message={params.error} /> : null}
      {params.saved ? (
        <p className="rounded-2xl border border-[var(--brand-green)]/30 bg-[var(--brand-green)]/10 px-3 py-2 text-sm font-bold text-[var(--brand-green)]">
          Product saved.
        </p>
      ) : null}

      <BarcodeSearchForm
        defaultBarcode={params.barcode}
        meal={params.meal}
        date={params.date}
      />

      {barcodeError ? <BarcodeFailureCard message={barcodeError} /> : null}

      {localMatches.length > 0 ? (
        <section className="space-y-3">
          {localMatches.map((food) => (
            <LocalBarcodeMatchCard
              key={`${food.foodId}|${food.servingId}`}
              food={food}
              meal={params.meal}
              date={params.date}
              returnTo={returnTo}
            />
          ))}
        </section>
      ) : null}

      {liveResult && !liveResult.ok ? (
        <BarcodeFailureCard message={openFoodFactsFailureMessage(liveResult.reason)} />
      ) : null}

      {parsedLive && !parsedLive.ok ? (
        <BarcodeFailureCard message={parseFailureMessage(parsedLive.reason)} />
      ) : null}

      {normalizedBarcode && parsedLive?.ok ? (
        <LiveBarcodeReviewCard
          product={parsedLive.product}
          barcode={normalizedBarcode}
          returnTo={returnTo}
        />
      ) : null}

      <Link
        href={backHref}
        className="secondary-button inline-flex items-center justify-center"
      >
        Back to foods
      </Link>
    </TrackingPageShell>
  );
}

function firstSearchParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function buildBackHref(meal?: string, date?: string) {
  if (!meal || !date) return "/log";
  const params = new URLSearchParams({ date });
  return `/log/${encodeURIComponent(meal)}/add?${params.toString()}`;
}

function buildScanReturnTo(
  meal?: string,
  date?: string,
  barcode?: string | null,
) {
  const params = new URLSearchParams();
  if (meal) params.set("meal", meal);
  if (date) params.set("date", date);
  if (barcode) params.set("barcode", barcode);
  const query = params.toString();
  return query ? `/scan?${query}` : "/scan";
}

function openFoodFactsFailureMessage(reason: "not_found" | "request_failed") {
  if (reason === "not_found") {
    return "Open Food Facts did not find a product for this barcode.";
  }

  return "Open Food Facts could not be reached. Please try again.";
}

function parseFailureMessage(reason: string) {
  switch (reason) {
    case "wrong_country":
      return "This product is not listed for Canada or the United States.";
    case "quality_errors":
      return "Open Food Facts reports quality errors for this product.";
    case "missing_name":
      return "This product is missing a usable name.";
    case "missing_serving":
      return "This product is missing serving size data.";
    case "missing_nutrition":
    case "missing_macros":
      return "This product is missing enough nutrition data to save.";
    case "obsolete_product":
      return "This product is marked obsolete in Open Food Facts.";
    default:
      return "This product could not be imported from Open Food Facts.";
  }
}
