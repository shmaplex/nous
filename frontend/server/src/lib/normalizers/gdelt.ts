// frontend/src/lib/normalizers/gdelt.ts
import type { Article, NormalizerFn } from "@/types";

/**
 * Normalizer for GDELT API entries.
 *
 * Maps GDELT article fields to our Article type.
 */
function normalizeGdeltArticle(a: any): Article {
	return {
		id: crypto.randomUUID(),
		url: a.url,
		title: a.title ?? "Untitled",
		source: a.domain ?? undefined,
		sourceDomain: a.domain ?? undefined,
		sourceType: "gdelt",

		// Map socialimage → image if present
		image: a.socialimage || undefined,

		// Extra GDELT fields
		mobileUrl: a.url_mobile || undefined,
		sourceCountry: a.sourcecountry || undefined,

		language: a.language || undefined,
		publishedAt: a.seendate ? new Date(a.seendate).toISOString() : undefined,

		summary: undefined,
		content: undefined,
		categories: undefined,
		tags: undefined,

		edition: "international",
		analyzed: false,
		confidence: 0.8,

		raw: a,
		fetchedAt: new Date().toISOString(),
	};
}
