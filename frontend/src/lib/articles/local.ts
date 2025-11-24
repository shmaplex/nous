// frontend/src/lib/articles/local.ts
import { type ArticleAnalyzed, ArticleAnalyzedSchema } from "@/types";
import { DeleteArticle, FetchArticles, SaveArticle } from "../../../wailsjs/go/main/App";

/**
 * Load analyzed or local articles from backend (OrbitDB / Go bridge)
 *
 * @returns Array of ArticleAnalyzed objects
 */
export const loadLocalArticles = async (): Promise<ArticleAnalyzed[]> => {
	try {
		const result = await FetchArticles();
		if (!result) return [];

		let parsed: unknown;
		try {
			parsed = JSON.parse(result);
		} catch {
			console.warn("FetchArticles returned invalid JSON:", result);
			return [];
		}

		const validArticles = (Array.isArray(parsed) ? parsed : [])
			.map((a: unknown) => {
				try {
					const article = ArticleAnalyzedSchema.parse(a);
					return { ...article, id: article.id ?? crypto.randomUUID() };
				} catch {
					return null;
				}
			})
			.filter(Boolean) as ArticleAnalyzed[];

		return validArticles;
	} catch (err) {
		console.error("Failed to load local articles:", err);
		return [];
	}
};

/**
 * Save a single local or analyzed article.
 *
 * @param article - Partial article object to save
 * @returns `true` if saved successfully, `false` otherwise
 */
export const saveLocalArticle = async (article: Partial<ArticleAnalyzed>): Promise<boolean> => {
	try {
		const validArticle = ArticleAnalyzedSchema.parse(article);
		await SaveArticle(
			validArticle.title,
			validArticle.url,
			validArticle.content,
			validArticle.edition ?? "international",
		);
		return true;
	} catch (err) {
		console.error("Failed to save article:", err);
		return false;
	}
};

/**
 * Delete a local article by ID.
 *
 * @param id - ID of the article to delete
 * @returns `true` if deleted successfully, `false` otherwise
 */
export const deleteLocalArticle = async (id: string): Promise<boolean> => {
	try {
		await DeleteArticle(id);
		return true;
	} catch (err) {
		console.error("Failed to delete article:", err);
		return false;
	}
};

/**
 * Save multiple articles at once.
 *
 * @param articles - Array of partial ArticleAnalyzed objects
 * @returns Array of booleans indicating success for each article
 */
export const saveLocalArticlesBatch = async (
	articles: Partial<ArticleAnalyzed>[],
): Promise<boolean[]> => {
	const results = await Promise.all(articles.map(saveLocalArticle));
	return results;
};

/**
 * Filter articles by optional political bias, edition, date range, cognitive bias, sentiment, tags, source/domain, or sourceType.
 *
 * @param articles - Array of ArticleAnalyzed to filter
 * @param options - Filtering options
 * @returns Filtered array of ArticleAnalyzed
 */
export const filterLocalArticles = (
	articles: ArticleAnalyzed[],
	options?: {
		biasFilter?: "left" | "center" | "right" | "all";
		editionFilter?: string;
		startDate?: string;
		endDate?: string;
		cognitiveBiasFilter?: string; // filter by name of cognitive bias
		sentimentFilter?: string; // e.g., positive / negative / neutral
		tagFilter?: string; // filter by tags
		sourceFilter?: string; // filter by domain
		sourceTypeFilter?: string; // filter by sourceType
	},
): ArticleAnalyzed[] => {
	const {
		biasFilter = "all",
		editionFilter,
		startDate,
		endDate,
		cognitiveBiasFilter,
		sentimentFilter,
		tagFilter,
		sourceFilter,
		sourceTypeFilter,
	} = options ?? {};

	return articles.filter((a) => {
		// ----------------------
		// Political Bias
		// ----------------------
		const bias = a.politicalBias ?? "center";
		const biasMatches = biasFilter === "all" ? true : bias === biasFilter;

		// ----------------------
		// Edition / Regional
		// ----------------------
		const editionMatches = editionFilter ? a.edition === editionFilter : true;

		// ----------------------
		// Date Range
		// ----------------------
		const date = a.publishedAt ? new Date(a.publishedAt) : null;
		const startMatches = startDate ? date && date >= new Date(startDate) : true;
		const endMatches = endDate ? date && date <= new Date(endDate) : true;

		// ----------------------
		// Cognitive Bias
		// ----------------------
		const cognitiveMatches = cognitiveBiasFilter
			? a.cognitiveBiases?.some((cb) =>
					cb.bias.toLowerCase().includes(cognitiveBiasFilter.toLowerCase()),
				)
			: true;

		// ----------------------
		// Sentiment
		// ----------------------
		const sentimentMatches = sentimentFilter
			? a.sentiment?.toLowerCase() === sentimentFilter.toLowerCase()
			: true;

		// ----------------------
		// Tags
		// ----------------------
		const tagMatches = tagFilter
			? a.tags?.some((t) => t.toLowerCase() === tagFilter.toLowerCase())
			: true;

		// ----------------------
		// Source / Domain
		// ----------------------
		const sourceMatches = sourceFilter
			? (a.source ?? "").toLowerCase() === sourceFilter.toLowerCase()
			: true;

		// ----------------------
		// Source Type
		// ----------------------
		const sourceTypeMatches = sourceTypeFilter
			? (a.sourceType ?? "").toLowerCase() === sourceTypeFilter.toLowerCase()
			: true;

		return (
			biasMatches &&
			editionMatches &&
			startMatches &&
			endMatches &&
			cognitiveMatches &&
			sentimentMatches &&
			tagMatches &&
			sourceMatches &&
			sourceTypeMatches
		);
	});
};
