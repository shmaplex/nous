// frontend/src/lib/articles.ts
import { type ArticleAnalyzed, ArticleAnalyzedSchema } from "@/types";
import {
	DeleteArticle,
	FetchArticles,
	GetLocation,
	SaveArticle,
	SetLocation,
} from "../../wailsjs/go/main/App";

// Allowed bias values
const BIASES = ["left", "center", "right"] as const;

/**
 * Safely load articles from backend.
 * Falls back to empty array if invalid JSON or errors.
 */
export const loadArticlesFromBackend = async (): Promise<ArticleAnalyzed[]> => {
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

		const validArticles = (parsed as unknown[])
			.map((a: unknown) => {
				try {
					const parsedArticle = ArticleAnalyzedSchema.parse(a);
					return { ...parsedArticle, id: parsedArticle.id ?? crypto.randomUUID() };
				} catch {
					return null;
				}
			})
			.filter(Boolean) as ArticleAnalyzed[];

		return validArticles;
	} catch (err) {
		console.error("Failed to load articles:", err);
		return [];
	}
};

/**
 * Save a new article
 */
export const saveArticle = async (
	title: string,
	url: string,
	content: string,
	edition?: string,
): Promise<boolean> => {
	const newArticle = { title, url, content, edition };

	try {
		ArticleAnalyzedSchema.parse(newArticle);
	} catch (err) {
		console.error("Invalid article:", err);
		return false;
	}

	try {
		await SaveArticle(title, url, content, edition || "international");
		return true;
	} catch (err) {
		console.error("Failed to save article:", err);
		return false;
	}
};

/**
 * Delete an article by ID
 */
export const deleteArticle = async (id: string): Promise<boolean> => {
	try {
		await DeleteArticle(id);
		return true;
	} catch (err) {
		console.error("Failed to delete article:", err);
		return false;
	}
};

/**
 * Get user location from backend
 */
export const getLocation = async (): Promise<string> => {
	try {
		const loc = await GetLocation();
		return loc || "";
	} catch (err) {
		console.error("Failed to get location:", err);
		return "";
	}
};

/**
 * Set user location to backend
 */
export const setLocation = async (loc: string): Promise<void> => {
	try {
		await SetLocation(loc);
	} catch (err) {
		console.error("Failed to update location:", err);
	}
};

/**
 * Filter articles by bias and edition
 */
export const filterArticles = (
	articles: ArticleAnalyzed[],
	biasFilter: "left" | "center" | "right" | "all",
	locationFilter: string,
): ArticleAnalyzed[] => {
	return articles.filter((a) => {
		const bias: "left" | "center" | "right" = a.politicalBias ?? "center"; // default if missing
		const biasMatches = biasFilter === "all" ? BIASES.includes(bias) : bias === biasFilter;

		// If locationFilter is "international", ignore edition
		const locationMatches =
			locationFilter === "international" || !locationFilter || a.edition === locationFilter;

		return biasMatches && locationMatches;
	});
};
