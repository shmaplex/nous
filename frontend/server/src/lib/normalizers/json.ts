// frontend/src/lib/normalizers/json.ts
import type { Article, Edition, NormalizerFn, Source } from "@/types";
import { editions } from "@/types";

/**
 * Normalizer for generic JSON API entries.
 */
export const normalizeJson: NormalizerFn = (a, source): Article => {
	return {
		id: a.url ?? a.id ?? crypto.randomUUID(),
		title: a.title ?? "Untitled",
		url: a.url ?? "",
		content: a.content ?? a.description,
		summary: a.description,
		image: a.imageUrl ?? a.urlToImage,
		categories: a.categories ?? [],
		tags: a.tags ?? [],
		language: a.language,
		author: a.author,
		publishedAt: a.publishedAt ?? a.published_date,
		edition: editions.includes(a.edition as Edition) ? (a.edition as Edition) : "other",
		analyzed: false,
		raw: a,
		sourceMeta: {
			name: source.name,
			bias: "center",
		},
	};
};
