import { type ArticleFederated, ArticleFederatedSchema } from "@/types";
import {
	DeleteFederatedArticle,
	FetchFederatedArticles,
	SaveFederatedArticle,
} from "../../../wailsjs/go/main/App";

/**
 * Load all federated articles from the backend (Wails Go binding)
 *
 * @returns Array of validated ArticleFederated objects
 */
export const loadFederatedArticles = async (): Promise<ArticleFederated[]> => {
	try {
		const result = await FetchFederatedArticles();
		if (!result) return [];

		let parsed: unknown;
		try {
			parsed = JSON.parse(result);
		} catch {
			console.warn("FetchFederatedArticles returned invalid JSON:", result);
			return [];
		}

		const validArticles = (Array.isArray(parsed) ? parsed : [])
			.map((a: unknown) => {
				try {
					const article = ArticleFederatedSchema.parse(a);
					return { ...article, cid: article.cid ?? crypto.randomUUID() };
				} catch {
					return null;
				}
			})
			.filter(Boolean) as ArticleFederated[];

		return validArticles;
	} catch (err) {
		console.error("Failed to load federated articles:", err);
		return [];
	}
};

/**
 * Save a single federated article to the backend via Wails
 *
 * @param article - Partial federated article object
 * @returns true if successful
 */
export const saveFederated = async (article: Partial<ArticleFederated>): Promise<boolean> => {
	try {
		const validArticle = ArticleFederatedSchema.parse({
			...article,
			cid: article.cid ?? crypto.randomUUID(),
		});

		await SaveFederatedArticle(validArticle);
		return true;
	} catch (err) {
		console.error("Failed to save federated article:", err);
		return false;
	}
};

/**
 * Delete a federated article by CID via Wails
 *
 * @param cid - CID of the article to delete
 * @returns true if successful
 */
export const deleteFederated = async (cid: string): Promise<boolean> => {
	try {
		await DeleteFederatedArticle(cid);
		return true;
	} catch (err) {
		console.error("Failed to delete federated article:", err);
		return false;
	}
};
