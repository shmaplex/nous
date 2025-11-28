/**
 * @file ai/sources/adfontes.server.ts
 * Fetch + normalize ratings from Ad Fontes.
 */

import { SourceMetaPartial } from "@/types";
import { normalizeBias } from "./helpers";

const ADFONTES_URL =
  "https://adfontesmedia.com/static/media/media-ratings-dataset.json";

interface AdFontesRow {
  Source: string;
  Bias: string;
  Reliability: number;
}

let cache: Record<
  string,
  { bias: string; reliability: number }
> = {};

async function loadDataset() {
  if (Object.keys(cache).length > 0) return cache;

  try {
    const res = await fetch(ADFONTES_URL);
    const rows: AdFontesRow[] = await res.json();

    for (const row of rows) {
      cache[row.Source.trim()] = {
        bias: row.Bias,
        reliability: row.Reliability,
      };
    }
  } catch (err) {
    console.error("AdFontes fetch error:", err);
  }

  return cache;
}

/**
 * Fetch Ad Fontes metadata for a single source.
 */
export async function fetchAdFontes(
  name: string
): Promise<SourceMetaPartial> {
  const dataset = await loadDataset();

  const row = dataset[name];
  if (!row) return {};

  return {
    adFontes: normalizeBias(row.bias),
    adFontesReliability: row.reliability,
  };
}