/**
 * @file ai/sources/allsides.server.ts
 * Scrape AllSides media bias ratings.
 */

import * as cheerio from "cheerio";
import { normalizeBias } from "./helpers";
import { SourceMetaPartial } from "@/types";

const ALLSIDES_URL =
  "https://www.allsides.com/media-bias/media-bias-ratings";

let cache: Record<string, string> = {};

async function loadTable() {
  if (Object.keys(cache).length > 0) return cache;

  try {
    const res = await fetch(ALLSIDES_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    $("table tbody tr").each((_, el) => {
      const name = $(el).find(".views-field-title a").text().trim();
      const rawBias = $(el)
        .find(".views-field-field-bias-image a")
        .text()
        .trim();

      if (name) cache[name] = rawBias;
    });
  } catch (err) {
    console.error("AllSides fetch error:", err);
  }

  return cache;
}

/**
 * Fetch AllSides metadata for a single source.
 */
export async function fetchAllSides(
  name: string
): Promise<SourceMetaPartial> {
  const table = await loadTable();
  const raw = table[name];
  if (!raw) return {};

  return { allSides: normalizeBias(raw) };
}