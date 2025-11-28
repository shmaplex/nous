/**
 * @file ai/sources/mbfc.server.ts
 * Scrape Media Bias/Fact Check for bias + factuality.
 */

import * as cheerio from "cheerio";
import { SourceMetaPartial } from "@/types";
import { Factuality } from "@/types";
import { normalizeBias } from "./helpers";

const MBFC_URL = "https://mediabiasfactcheck.com/";

let cache: Record<string, SourceMetaPartial> = {};

function normalizeFactuality(raw: string): Factuality {
  const f = raw.toLowerCase();

  if (f.includes("high")) return "high";
  if (f.includes("mostly factual")) return "medium";
  if (f.includes("mixed") || f.includes("medium")) return "medium";
  if (f.includes("low")) return "low";

  return "unknown";
}

export async function fetchMBFC(
  name: string
): Promise<SourceMetaPartial> {
  if (cache[name]) return cache[name];

  const slug = encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"));
  const url = `${MBFC_URL}${slug}/`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const biasRaw = $("strong:contains('Bias:')")
      .parent()
      .text()
      .replace(/Bias:/i, "")
      .trim();

    const factualRaw = $("strong:contains('Factual Reporting:')")
      .parent()
      .text()
      .replace(/Factual Reporting:/i, "")
      .trim();

    const result = {
      mbfc: normalizeBias(biasRaw),
      mbfcFactuality: normalizeFactuality(factualRaw),
    };

    cache[name] = result;
    return result;
  } catch (err) {
    console.error("MBFC fetch error:", err);
    return {};
  }
}