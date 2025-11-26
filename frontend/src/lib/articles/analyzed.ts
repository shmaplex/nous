import { type ArticleAnalyzed, ArticleAnalyzedSchema } from "@/types";
import {
	DeleteAnalyzedArticle,
	FetchAnalyzedArticles,
	SaveAnalyzedArticle,
} from "../../../wailsjs/go/main/App";

/**
 * Load all analyzed articles from the backend (OrbitDB / Go bridge)
 *
 * @returns Array of validated ArticleAnalyzed objects
 */
export const loadAnalyzedArticles = async (): Promise<ArticleAnalyzed[]> => {
	try {
		const result = await FetchAnalyzedArticles();
		if (!result) return [];

		let parsed: unknown;
		try {
			parsed = JSON.parse(result);
		} catch {
			console.warn("FetchAnalyzedArticles returned invalid JSON:", result);
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
		console.error("Failed to load analyzed articles:", err);
		return [];
	}
};

/**
 * Save a single analyzed article to the backend.
 *
 * @param article - Partial ArticleAnalyzed object to save
 * @returns `true` if saved successfully, `false` otherwise
 */
export const saveAnalyzedArticle = async (article: Partial<ArticleAnalyzed>): Promise<boolean> => {
	try {
		const validArticle = ArticleAnalyzedSchema.parse({
			...article,
			id: article.id ?? crypto.randomUUID(),
			analyzed: true,
			fetchedAt: article.fetchedAt ?? new Date().toISOString(),
		});

		await SaveAnalyzedArticle(validArticle);
		return true;
	} catch (err) {
		console.error("Failed to save analyzed article:", err);
		return false;
	}
};

/**
 * Delete an analyzed article by ID.
 *
 * @param id - ID of the article to delete
 * @returns `true` if deleted successfully, `false` otherwise
 */
export const deleteAnalyzedArticle = async (id: string): Promise<boolean> => {
	try {
		await DeleteAnalyzedArticle(id);
		return true;
	} catch (err) {
		console.error("Failed to delete analyzed article:", err);
		return false;
	}
};

/**
 * Save multiple analyzed articles in a batch.
 *
 * @param articles - Array of partial ArticleAnalyzed objects
 * @returns Array of booleans indicating success for each article
 */
export const saveAnalyzedArticlesBatch = async (
	articles: Partial<ArticleAnalyzed>[],
): Promise<boolean[]> => {
	return Promise.all(articles.map(saveAnalyzedArticle));
};

/**
 * Filter analyzed articles by optional criteria:
 * political bias, edition, date range, cognitive bias, sentiment, tags, source/domain, or sourceType.
 *
 * @param articles - Array of ArticleAnalyzed objects to filter
 * @param options - Filtering options
 * @returns Filtered array of ArticleAnalyzed objects
 */
export const filterAnalyzedArticles = (
	articles: ArticleAnalyzed[],
	options?: {
		biasFilter?: "left" | "center" | "right" | "all";
		editionFilter?: string;
		startDate?: string;
		endDate?: string;
		cognitiveBiasFilter?: string;
		sentimentFilter?: string;
		tagFilter?: string;
		sourceFilter?: string;
		sourceTypeFilter?: string;
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
		const bias = a.sourceMeta?.bias ?? "center";
		const biasMatches = biasFilter === "all" ? true : bias === biasFilter;

		const editionMatches = editionFilter ? a.edition === editionFilter : true;

		const date = a.publishedAt ? new Date(a.publishedAt) : null;
		const startMatches = startDate ? date && date >= new Date(startDate) : true;
		const endMatches = endDate ? date && date <= new Date(endDate) : true;

		const cognitiveMatches = cognitiveBiasFilter
			? a.cognitiveBiases?.some((cb) =>
					cb.bias.toLowerCase().includes(cognitiveBiasFilter.toLowerCase()),
				)
			: true;

		const sentimentMatches = sentimentFilter
			? a.sentiment?.toLowerCase() === sentimentFilter.toLowerCase()
			: true;

		const tagMatches = tagFilter
			? a.tags?.some((t) => t.toLowerCase() === tagFilter.toLowerCase())
			: true;

		const sourceMatches = sourceFilter
			? (a.source ?? "").toLowerCase() === sourceFilter.toLowerCase()
			: true;

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
