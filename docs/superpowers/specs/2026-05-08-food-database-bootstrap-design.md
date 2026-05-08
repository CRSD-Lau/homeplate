# Food Database Bootstrap + Barcode Lookup Design

## Summary

Phase 2B makes HomePlate useful before the household has manually entered a pantry. It adds a fast path to build a local branded-product food database from Open Food Facts, with each product's label serving as the default serving when the source provides a usable grams or millilitres equivalent. It also adds manual barcode lookup so a missing product can be fetched live, reviewed, saved locally, and then logged.

Camera scanning is intentionally left for the next slice. A scanner only produces a barcode; this phase builds the product data behind that barcode.

## Problem

The Phase 2A logging flow is fast only after foods exist in the database. For real day-to-day use, HomePlate needs thousands of common packaged products with nutrition tied to the serving sizes printed on labels, not only generic 100 g foods.

Retailer scraping is not a good foundation for this. Grocery sites are fragile, can be incomplete, and may not match the package in the user's hand. The first durable source should be product/barcode nutrition data designed for reuse.

## Goals

- Import a useful local database quickly from Open Food Facts.
- Prefer Canadian and United States products by default, with a configurable country filter.
- Store each imported product as a branded food with its barcode, brand, source, and raw source payload.
- Use the product's label serving as the default serving when a serving grams or millilitres equivalent can be parsed.
- Add a secondary `100 g` or `100 ml` serving when the conversion equivalent is known.
- Map the nutrients HomePlate already tracks: calories, protein, carbs, fat, fibre, sugar, and sodium.
- Skip rows that cannot support trustworthy logging, and report exactly why they were skipped.
- Add manual barcode lookup on `/scan`: type/paste barcode, find local product, otherwise fetch Open Food Facts live and review before saving.
- Keep imported products searchable through the existing add-food flow.

## Non-Goals

- No browser camera barcode scanner in this slice.
- No retailer scraping in this slice.
- No CNF generic-food import in this slice.
- No OCR or Nutrition Facts image upload in this slice.
- No committed copy of the Open Food Facts dump or generated database snapshot.
- No automatic writes back to Open Food Facts.
- No paid/commercial food database integration.

## Source Choice

Open Food Facts is the first source because it is barcode-oriented, open, and already exposes product name, brands, `serving_size`, `serving_quantity`, `nutrition_data_per`, countries, quality tags, and `nutriments`. Bulk data is available through published exports, including JSONL/CSV-style dumps and a Hugging Face dataset.

USDA FoodData Central branded foods remains a possible later source. It has useful GTIN/UPC, serving size, serving unit, and household serving text fields, but adding it in the same slice would require source precedence and duplicate-resolution work. Phase 2B should make one source excellent before adding a second one.

## Licensing And Attribution

Open Food Facts data is open data under ODbL terms with attribution and share-alike requirements. HomePlate will not commit the downloaded dump, imported product rows, or a generated SQLite/Postgres snapshot to the repository.

The importer will store an `open_food_facts` row in `data_sources` with license and attribution text. The app will show a small source/attribution line on reviewed imported products and barcode lookup results. If a HomePlate database dump containing Open Food Facts data is ever redistributed, it must preserve the attribution and satisfy the applicable ODbL obligations.

API requests must send a custom User-Agent identifying HomePlate. The live lookup path must be conservative and should not batch against the API; bulk work should use export files.

## Data Model

Use the existing schema where possible:

- `data_sources`: one `Open Food Facts` source with `sourceType = open_food_facts`, license name, and attribution.
- `import_runs`: one row per bulk import, with status and summary counts.
- `source_records`: one row per accepted or reviewed source product, keyed by source and barcode/external id, storing the raw payload.
- `foods`: one branded food per imported product, with `barcode`, `brand`, `foodType = branded`, `sourceId`, `sourceExternalId = barcode`, and `confidenceStatus = imported` for bulk imports or `provisional` for newly fetched review results.
- `servings`: default label serving plus optional `100 g` or `100 ml` serving.
- `food_nutrient_values`: one nutrient row for the default label serving.

Add a migration with source upsert guards:

- `foods_source_external_unique`: unique `(source_id, source_external_id)` where both values are present.
- `source_records_source_external_unique`: unique `(data_source_id, external_id)` where `external_id` is present.

## Import Command

Add a script command:

```bash
pnpm db:import:off -- --country=canada,united-states --limit=25000
```

The command downloads or reuses the Open Food Facts JSONL export under ignored `data/openfoodfacts/`, streams it without loading the full dump into memory, filters rows, upserts accepted products, and prints an import summary.

Supported flags:

- `--country=canada,united-states`: comma-separated country slugs matched against `countries_tags` and `main_countries_tags`.
- `--limit=25000`: maximum accepted products, after filtering.
- `--source-file=data/openfoodfacts/openfoodfacts-products.jsonl.gz`: use an existing dump file.
- `--download`: download the latest dump if no source file exists.
- `--dry-run`: parse and summarize without writing.

The default import should be useful within minutes, not hours. It should prefer rows with higher completeness, more scans, and no fatal data-quality errors.

## Import Filtering

Accept a product only when all of these are true:

- Barcode exists, normalizes to digits, and is plausibly UPC/EAN/GTIN length.
- Product name exists.
- Product is not obsolete.
- Nutrition data is present.
- Serving size text or serving quantity can produce a grams or millilitres equivalent.
- Calories and at least protein, carbs, and fat can be mapped for the serving or derived from per-100 g/ml values.
- `data_quality_errors_tags` is empty.
- Product country matches the import country filter, unless the importer is run without a country filter.

Warnings do not automatically exclude a product, but the import summary reports warning counts and stores warning tags in `source_records.rawPayload`.

## Serving And Nutrition Mapping

For packaged branded foods, the default HomePlate serving is the label serving. Examples:

- `1 bar (42 g)` with `grams = 42`
- `3/4 cup (55 g)` with `grams = 55`
- `1 bottle (500 ml)` with `millilitres = 500`

Nutrient mapping order:

1. Prefer Open Food Facts `_serving` nutrient fields when present and valid.
2. Otherwise derive serving nutrients from `_100g` fields using the parsed serving grams or millilitres.
3. Store sodium in milligrams. Open Food Facts sodium values are treated as grams when using standard nutriment fields, then converted to milligrams. If sodium is missing but salt is present, derive sodium from salt using `salt / 2.5`.

The imported default serving remains the base serving for HomePlate scaling. If a product has `grams = 42`, the optional `100 g` serving scales from the default serving through the existing nutrition helper.

Rows without a usable grams or millilitres equivalent are skipped in bulk import because they would recreate the current problem: foods that look loggable but cannot scale reliably.

## Barcode Lookup Flow

The `/scan` page becomes a manual barcode lookup page in this slice:

1. User types or pastes a barcode.
2. Server action normalizes the barcode.
3. HomePlate searches local `foods` by barcode.
4. If found, the page shows matching local product cards with log/save actions.
5. If not found, HomePlate calls Open Food Facts API v2 with a custom User-Agent and a narrow field list.
6. If the API returns a usable product, HomePlate shows a review screen with product name, brand, barcode, serving, nutrients, source, and any quality warnings.
7. User saves the product locally.
8. Saved product becomes searchable and loggable immediately.

A failed lookup should explain the reason in plain language: invalid barcode, no product found, product has no nutrition data, serving size could not be converted, or source returned incomplete nutrients.

## Review And Trust

Bulk imported products use `confidenceStatus = imported`.

Live barcode results use `confidenceStatus = provisional` until saved from the review screen. Saving does not mean the nutrition is guaranteed; it means the household accepted the imported label data for private logging. The Foods UI should continue to allow editing brand, aliases, serving labels, serving equivalents, and nutrients.

## UI Changes

- Replace the current `/scan` placeholder with manual barcode lookup.
- Add source/quality badges to barcode review results.
- Add a "Save product" action that creates the food, serving, nutrient row, and source record.
- Add a "Log this" path after saving when the lookup came from an add-food meal flow.
- Keep the add-food "Scan barcode" button as navigation to `/scan?mealType=...&date=...` so the user can return to the selected meal after saving.

No camera permission prompts appear in Phase 2B.

## Error Handling

- Bulk import creates an `import_runs` row with `failed` status if the stream, parsing, or database write fails.
- Each skip reason is counted separately.
- Duplicate source products update the existing imported product instead of creating duplicates.
- Existing household edits should not be overwritten blindly. If a food was edited after import or marked verified/manual later, the importer stores the new raw source record but does not replace household-edited fields.
- Live API failures show retryable messages and do not create partial foods.

## Tests

Unit tests:

- Barcode normalization accepts common UPC/EAN strings and rejects invalid input.
- Open Food Facts product parser maps a label serving with grams.
- Parser maps a label serving with millilitres.
- Parser prefers `_serving` nutrient values when present.
- Parser derives serving nutrients from `_100g` values when `_serving` is absent.
- Sodium mapping converts sodium grams to milligrams.
- Salt fallback derives sodium when sodium is absent.
- Skip reasons are stable for missing barcode, name, nutrition, serving equivalent, macros, and fatal quality errors.

Integration-style tests with mocked DB/API:

- Bulk import upserts source, source records, foods, servings, and nutrient rows.
- Re-running import does not duplicate products.
- Import does not overwrite a household-edited verified/manual food.
- Manual barcode lookup returns a local match before making an API request.
- Manual barcode lookup fetches, reviews, saves, and then returns the saved product locally.

Manual acceptance:

- Run a dry import and confirm skip counts are understandable.
- Import at least 1,000 products and verify they appear in All foods search.
- Search for a branded food and log the default label serving.
- Confirm the same product also has `100 g` or `100 ml` when applicable.
- Type a known barcode on `/scan`, save the product, and log it.
- Edit an imported product's serving/nutrition and confirm future imports do not overwrite household edits.

Final verification:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Rollout

1. Implement parser and barcode normalization as pure helpers with tests.
2. Implement streaming import script with dry-run support.
3. Add database upsert helpers and import-run summaries.
4. Add manual barcode lookup and review/save UI.
5. Run a small import locally and validate search/logging.
6. Run the final verification suite.

## Risks

- Open Food Facts data quality varies by product. Mitigation: strict filters, review screen for live lookups, source badges, and editable imported products.
- ODbL obligations matter if data is redistributed. Mitigation: do not commit dumps or DB snapshots; store attribution; document redistribution caution.
- The full export is large. Mitigation: stream the gzipped dump, support limits, and keep files under ignored `data/`.
- Country filters may miss useful products. Mitigation: make country selection configurable and let later imports add more countries without duplicating existing products.
