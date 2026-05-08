import { createReadStream, createWriteStream, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";

import { config } from "dotenv";

import { closeDb } from "../src/db";
import {
  createImportSummary,
  finishOpenFoodFactsImportRun,
  recordImportResult,
  startOpenFoodFactsImportRun,
  upsertOpenFoodFactsProduct,
} from "../src/lib/open-food-facts-import";
import { parseOpenFoodFactsProduct } from "../src/lib/open-food-facts";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

type Args = {
  countries: string[];
  limit: number;
  dryRun: boolean;
  download: boolean;
  sourceFile: string;
};

const exportUrl =
  "https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz";
const defaultSourceFile = "data/openfoodfacts/openfoodfacts-products.jsonl.gz";
const defaultUserAgent =
  "HomePlate/0.1 private household app (development import)";
const countryValuePattern = /^[A-Za-z0-9:_-]+$/;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceFile = resolve(args.sourceFile);

  if (args.download && !existsSync(sourceFile)) {
    await downloadExport(sourceFile);
  }

  if (!existsSync(sourceFile)) {
    throw new Error(
      `Source file not found: ${sourceFile}. Run with --download or pass --source-file=...`,
    );
  }

  console.error(
    `Open Food Facts import sourceFile=${sourceFile} dryRun=${args.dryRun} limit=${args.limit} countries=${args.countries.join(",")} download=${args.download}`,
  );

  const summary = createImportSummary();
  const importRun = args.dryRun
    ? null
    : await startOpenFoodFactsImportRun(sourceFile);

  try {
    for await (const raw of readJsonlGzip(sourceFile)) {
      const parsed = parseOpenFoodFactsProduct(raw, {
        countries: args.countries,
      });

      if (!parsed.ok) {
        recordImportResult(summary, parsed);
        continue;
      }

      if (!args.dryRun && importRun) {
        await upsertOpenFoodFactsProduct({
          dataSourceId: importRun.dataSourceId,
          importRunId: importRun.id,
          product: parsed.product,
        });
      }

      recordImportResult(summary, {
        ok: true,
        barcode: parsed.product.barcode,
        warnings: parsed.product.qualityWarnings,
      });

      if (summary.accepted >= args.limit) break;
    }

    if (importRun) {
      await finishOpenFoodFactsImportRun(importRun.id, "completed", summary);
    }
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    if (importRun) {
      await finishOpenFoodFactsImportRun(importRun.id, "failed", summary);
    }
    throw error;
  }
}

function parseArgs(argv: string[]): Args {
  let parsedCountries: string[] | null = null;
  const args: Args = {
    countries: ["canada", "united-states"],
    limit: 25000,
    dryRun: false,
    download: false,
    sourceFile: defaultSourceFile,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--download") {
      args.download = true;
    } else if (arg.startsWith("--limit=")) {
      args.limit = Number(arg.slice("--limit=".length));
    } else if (arg.startsWith("--country=")) {
      parsedCountries ??= [];
      parsedCountries.push(...splitCountryValue(arg.slice("--country=".length)));

      while (argv[index + 1] && !argv[index + 1].startsWith("--")) {
        index += 1;
        parsedCountries.push(...splitCountryValue(argv[index]));
      }
    } else if (arg === "--country") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--country requires a value.");
      }

      parsedCountries ??= [];
      parsedCountries.push(...splitCountryValue(value));
      index += 1;

      while (argv[index + 1] && !argv[index + 1].startsWith("--")) {
        index += 1;
        parsedCountries.push(...splitCountryValue(argv[index]));
      }
    } else if (arg.startsWith("--source-file=")) {
      args.sourceFile = arg.slice("--source-file=".length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(args.limit) || args.limit <= 0) {
    throw new Error("--limit must be greater than zero.");
  }

  if (parsedCountries !== null) {
    if (parsedCountries.length === 0) {
      throw new Error("--country must include at least one country.");
    }
    args.countries = parsedCountries;
  }

  return args;
}

function splitCountryValue(value: string) {
  return value
    .split(/[\s,]+/)
    .map((country) => country.trim())
    .filter(Boolean)
    .map((country) => {
      if (!countryValuePattern.test(country)) {
        throw new Error(
          `Invalid country value "${country}". Use only letters, digits, colon, underscore, or hyphen.`,
        );
      }
      return country;
    });
}

async function downloadExport(target: string) {
  mkdirSync(dirname(target), { recursive: true });
  const response = await fetch(exportUrl, {
    headers: {
      "User-Agent": process.env.OPEN_FOOD_FACTS_USER_AGENT || defaultUserAgent,
    },
  });

  if (!response.ok || !response.body) {
    throw new Error(`Download failed: HTTP ${response.status}`);
  }

  await pipeline(
    Readable.fromWeb(response.body as NodeReadableStream),
    createWriteStream(target),
  );
}

async function* readJsonlGzip(
  path: string,
): AsyncGenerator<Record<string, unknown>> {
  const rl = createInterface({
    input: createReadStream(path).pipe(createGunzip()),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    yield JSON.parse(line) as Record<string, unknown>;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDb);
