// frontend/src/lib/parsers/gdelt.ts
import type { Article, ParserFn, Source, SourceMeta } from "@/types";

/**
 * GDELT parser.
 *
 * GDELT v2 API format:
 * {
 *   articles: [
 *     {
 *       title: string,
 *       url: string,
 *       summary: string,
 *       publishedAt?: string,
 *       source?: string
 *     }
 *   ]
 * }
 */
export const gdeltParser: ParserFn = (raw: any, source: Source): Article[] => {
	if (!raw || !Array.isArray(raw.articles)) return [];

	return raw.articles.map((a: any) => ({
		id: a.url,
		title: a.title,
		url: a.url,
		content: a.summary,
		summary: a.summary,
		categories: a.categories ?? [],
		tags: a.tags ?? [],
		language: a.language,
		author: a.source,
		publishedAt: a.publishedAt,
		edition: "other",
		analyzed: false,
		raw: a,
		sourceMeta: {
			name: source.name,
			bias: "center",
		} satisfies SourceMeta,
	}));
};
