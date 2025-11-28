/**
 * @file sourceBias.server.ts
 * @description Unified library to fetch or map media bias ratings from major sources.
 */

/**
 * Example:
 * import { getBiasForSource, getUnifiedBias } from "./ai/sourceBias.server";
 * 
 * async function example() {
 *    const ratings = await getBiasForSource("Al Jazeera");
 *    const unified = getUnifiedBias(ratings);
 *    console.log(ratings); 
 *    // { sourceName: 'Al Jazeera', adFontes: 'lean-left', allSides: 'lean-left', mbfc: 'left' }
 *    console.log("Unified bias:", unified); // 'lean-left'
 * }
 */

import { PoliticalBias } from "@/types";

export interface MediaBiasRating {
  sourceName: string;
  adFontes?: PoliticalBias;
  allSides?: PoliticalBias;
  mbfc?: PoliticalBias; // Media Bias/Fact Check
}

/** Static mapping JSON for offline use */
const STATIC_BIAS_MAP: Record<string, MediaBiasRating> = {
  "Al Jazeera": {
    sourceName: "Al Jazeera",
    adFontes: "lean-left",
    allSides: "lean-left",
    mbfc: "left",
  },
  "BBC News": {
    sourceName: "BBC News",
    adFontes: "center",
    allSides: "center",
    mbfc: "left-center",
  },
  "CNN": {
    sourceName: "CNN",
    adFontes: "left",
    allSides: "left",
    mbfc: "left",
  },
  // Add more known sources here...
};

/**
 * Normalize bias from multiple sources into a single unified rating.
 * @param ratings MediaBiasRating object
 * @returns PoliticalBias
 */
export function getUnifiedBias(ratings: MediaBiasRating): PoliticalBias {
  const values = [ratings.adFontes, ratings.allSides, ratings.mbfc].filter(Boolean) as PoliticalBias[];
  if (values.length === 0) return "unknown";

  // Simple heuristic: pick the majority or first if no consensus
  const counts: Record<PoliticalBias, number> = {};
  values.forEach((v) => (counts[v] = (counts[v] || 0) + 1));

  let max = 0;
  let selected: PoliticalBias = "unknown";
  for (const [k, v] of Object.entries(counts)) {
    if (v > max) {
      max = v;
      selected = k as PoliticalBias;
    }
  }
  return selected;
}

/**
 * Get bias rating for a source.
 * First tries static mapping, can fallback to dynamic fetch logic (if implemented)
 * @param sourceName Name of the news source
 */
export async function getBiasForSource(sourceName: string): Promise<MediaBiasRating> {
  const normalized = STATIC_BIAS_MAP[sourceName];
  if (normalized) return normalized;

  // Optional: implement fetch/scrape logic for dynamic lookup
  // Example: scrape MBFC or AllSides (HTML parsing) if source not in STATIC_BIAS_MAP
  // const dynamicRating = await fetchBiasFromWeb(sourceName);
  return {
    sourceName,
    adFontes: "unknown",
    allSides: "unknown",
    mbfc: "unknown",
  };
}

/**
 * Example dynamic fetch stub (can use cheerio or puppeteer to parse site HTML)
 * Uncomment if you want to implement live scraping
 */
/*
import cheerio from "cheerio";
async function fetchBiasFromWeb(sourceName: string): Promise<MediaBiasRating> {
  // MBFC Example
  const url = `https://mediabiasfactcheck.com/${sourceName.toLowerCase().replace(/\s+/g, "-")}/`;
  const res = await fetch(url);
  if (!res.ok) return { sourceName, mbfc: "unknown" };
  const html = await res.text();
  const $ = cheerio.load(html);
  const biasText = $(".bias-rating").text().trim(); // adjust selector
  const bias: PoliticalBias = biasText.toLowerCase() as PoliticalBias;
  return { sourceName, mbfc: bias };
}
*/