// frontend/src/lib/articles/local.ts
import { type Article, ArticleSchema } from "@/types";
import {
	DeleteLocalArticle,
	FetchLocalArticles,
	SaveLocalArticle,
} from "../../../wailsjs/go/main/App";

/**
 * Load all local articles from the backend (OrbitDB / Go bridge)
 *
 * @returns Array of validated Article objects
 */
export const loadLocalArticles = async (): Promise<Article[]> => {
	try {
		const result = await FetchLocalArticles();
		if (!result) return [];

		let parsed: unknown;
		try {
			parsed = JSON.parse(result);
		} catch {
			console.warn("FetchLocalArticles returned invalid JSON:", result);
			return [];
		}

		const validArticles = (Array.isArray(parsed) ? parsed : [])
			.map((a: unknown) => {
				try {
					const article = ArticleSchema.parse(a);
					return { ...article, id: article.id ?? crypto.randomUUID() };
				} catch {
					return null;
				}
			})
			.filter(Boolean) as Article[];

		return validArticles;
	} catch (err) {
		console.error("Failed to load local articles:", err);
		return [];
	}
};

/**
 * Save a single local article to the backend.
 *
 * @param article - Partial article object to save
 * @returns `true` if saved successfully, `false` otherwise
 */
export const saveLocalArticle = async (article: Partial<Article>): Promise<boolean> => {
	try {
		// Validate the article against the schema
		const validArticle = ArticleSchema.parse({
			...article,
			id: article.id ?? crypto.randomUUID(),
			analyzed: false,
			fetchedAt: article.fetchedAt ?? new Date().toISOString(),
		});

		await SaveLocalArticle(validArticle, true);
		return true;
	} catch (err) {
		console.error("Failed to save local article:", err);
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
		await DeleteLocalArticle(id);
		return true;
	} catch (err) {
		console.error("Failed to delete local article:", err);
		return false;
	}
};

/**
 * Save multiple local articles in a batch.
 *
 * @param articles - Array of partial Article objects
 * @returns Array of booleans indicating success for each article
 */
export const saveLocalArticlesBatch = async (articles: Partial<Article>[]): Promise<boolean[]> => {
	return Promise.all(articles.map(saveLocalArticle));
};

/**
 * Filter local articles by optional criteria:
 * political bias, edition, date range, tags, source/domain, or sourceType.
 *
 * Note: Cognitive biases and sentiment are **not available** for local articles.
 *
 * @param articles - Array of Article objects to filter
 * @param options - Filtering options
 * @returns Filtered array of Article objects
 */
export const filterLocalArticles = (
	articles: Article[],
	options?: {
		biasFilter?: "left" | "center" | "right" | "all";
		editionFilter?: string;
		startDate?: string;
		endDate?: string;
		tagFilter?: string;
		sourceFilter?: string;
		sourceTypeFilter?: string;
	},
): Article[] => {
	const {
		biasFilter = "all",
		editionFilter,
		startDate,
		endDate,
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
			tagMatches &&
			sourceMatches &&
			sourceTypeMatches
		);
	});
};
