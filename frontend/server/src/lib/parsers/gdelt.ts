// frontend/src/lib/parsers/gdelt.ts
import type { Article, ParserFn, Source, SourceMeta } from "@/types";

/**
 * GDELT parser.
 *
 * Converts GDELT API response to an array of normalized Article objects.
 *
 * GDELT v2 API format example:
 * {
 *   articles: [
 *     {
 *       url: string,
 *       title: string,
 *       seendate: string,
 *       socialimage: string,
 *       domain: string,
 *       language: string,
 *       sourcecountry: string
 *     }
 *   ]
 * }
 */
export const gdeltParser: ParserFn = (raw: any, source: Source): Article[] => {
	if (!raw || !Array.isArray(raw.articles)) return [];

	return raw.articles.map((a: any) => ({
		id: a.url ?? crypto.randomUUID(),
		title: a.title ?? "Untitled",
		url: a.url,
		content: a.summary ?? "", // fallback empty
		summary: a.summary ?? "",
		categories: a.categories ?? [],
		tags: a.tags ?? [],
		language: a.language ?? "unknown",
		author: a.domain ?? source.name,
		publishedAt: a.seendate ?? undefined, // keep as string
		edition: "other",
		analyzed: false,
		raw: a,
		sourceMeta: {
			name: source.name,
			bias: "center",
		} satisfies SourceMeta,
	}));
};
