// frontend/src/lib/normalizers/gdelt.ts
import type { Article, NormalizerFn, Source } from "@/types";

/**
 * Normalizer for GDELT API entries.
 */
export const normalizeGdelt: NormalizerFn = (a, source): Article => {
	return {
		id: a.url ?? crypto.randomUUID(),
		title: a.title ?? "Untitled",
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
		sourceMeta: { name: source.name, bias: "center" },
	};
};
