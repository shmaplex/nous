import type { NormalizerFn } from "@/types";

import { normalizeGdelt } from "./gdelt";
import { normalizeHackerNews } from "./hn";
import { normalizeJson } from "./json";
import { normalizeReddit } from "./reddit";
import { normalizeRss } from "./rss";

/**
 * Registry of normalizers.
 */
export const normalizers: Record<string, NormalizerFn> = {
	json: normalizeJson,
	rss: normalizeRss,
	gdelt: normalizeGdelt,
	reddit: normalizeReddit,
	hn: normalizeHackerNews,
};

/**
 * Retrieves a normalizer for a source.
 * Defaults to JSON normalizer.
 */
export function getNormalizer(source: { normalizer?: string }): NormalizerFn {
	const norm = source.normalizer ?? "json";
	return normalizers[norm] ?? normalizeJson;
}
