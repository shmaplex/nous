// frontend/src/lib/articles/aggregator.ts
import type { ArticleAnalyzed } from "@/types";
import { fetchFederatedArticles } from "./federated";
import { loadLocalArticles } from "./local";
import { fetchApiFeed, fetchRssFeed } from "./sources";

/**
 * Aggregate all articles for the UI
 */
export const fetchAllArticles = async (): Promise<ArticleAnalyzed[]> => {
	const local = await loadLocalArticles();

	const federatedRaw = await fetchFederatedArticles();
	const federated: ArticleAnalyzed[] = federatedRaw.map((f) => ({
		id: crypto.randomUUID(),
		title: "Federated Article",
		url: "",
		content: "",
		analyzed: true,
		source: f.source ?? "",
		edition: f.edition ?? "other",
		ipfsHash: f.cid,
		analysisTimestamp: f.timestamp,
	}));

	// TODO: fetch external sources dynamically from user config
	const rss: ArticleAnalyzed[] = [];
	const api: ArticleAnalyzed[] = [];

	return [...local, ...federated, ...rss, ...api];
};
