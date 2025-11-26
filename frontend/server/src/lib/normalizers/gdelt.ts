// frontend/src/lib/normalizers/gdelt.ts
import type { Article, NormalizerFn } from "@/types";

/**
 * Normalizer for GDELT API entries.
 *
 * Maps GDELT article fields to our Article type.
 */
export const normalizeGdelt: NormalizerFn = (a, source): Article => {
	return {
		id: a.url ?? crypto.randomUUID(),
		title: a.title ?? "Untitled",
		url: a.url,
		content: a.summary ?? "", // GDELT v2 may not provide summary
		summary: a.summary ?? "",
		categories: a.categories ?? [], // default empty
		tags: a.tags ?? [], // default empty
		language: a.language ?? "unknown",
		author: a.domain ?? source.name, // use domain as author if available
		publishedAt: a.seendate ?? undefined, // keep as string
		edition: "other",
		analyzed: false,
		raw: a,
		sourceMeta: { name: source.name, bias: "center" },
	};
};
