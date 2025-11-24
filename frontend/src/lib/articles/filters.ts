// frontend/src/lib/articles/filters.ts
import type { ArticleAnalyzed } from "@/types";

const BIASES = ["left", "center", "right"] as const;

export const filterArticles = (
	articles: ArticleAnalyzed[],
	biasFilter: "left" | "center" | "right" | "all",
	editionFilter?: string,
): ArticleAnalyzed[] => {
	return articles.filter((a) => {
		const bias: "left" | "center" | "right" = a.politicalBias ?? "center";
		const biasMatches = biasFilter === "all" ? BIASES.includes(bias) : bias === biasFilter;
		const editionMatches =
			!editionFilter || editionFilter === "international" || a.edition === editionFilter;
		return biasMatches && editionMatches;
	});
};
