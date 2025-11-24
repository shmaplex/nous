import type { Article, ArticleAnalyzed } from "@/types";
import type { FederatedDB } from "./federated";
import { fetchFederatedArticleContent, fetchFederatedArticles } from "./federated";
import { loadLocalArticles } from "./local";
import { fetchApiFeed, fetchRssFeed } from "./sources";

/**
 * Aggregate all articles for the UI
 */
export const fetchAllArticles = async (
	federatedDB: FederatedDB,
	options?: { rssFeeds?: string[]; apiFeeds?: { url: string; apiKey?: string }[] },
): Promise<(Article | ArticleAnalyzed)[]> => {
	// 1️⃣ Load local articles
	const localArticles: (Article | ArticleAnalyzed)[] = await loadLocalArticles();

	// 2️⃣ Load federated article pointers
	const federatedPointers = await fetchFederatedArticles(federatedDB);

	// 3️⃣ Fetch full content for each federated article
	const federatedArticles: (Article | ArticleAnalyzed)[] = [];
	for (const pointer of federatedPointers) {
		const content = await fetchFederatedArticleContent(federatedDB, pointer.cid);
		if (!content) continue;

		// If the federated article has already been analyzed
		if (pointer.analyzed) {
			federatedArticles.push({
				id: pointer.cid,
				title: content.title ?? "Untitled",
				url: content.url ?? "",
				content: content.content ?? "",
				analyzed: true,
				source: pointer.source,
				edition: pointer.edition,
				ipfsHash: pointer.cid,
				analysisTimestamp: pointer.timestamp,
				tags: content.tags,
				politicalBias: content.politicalBias,
				sentiment: content.sentiment,
				cognitiveBiases: content.cognitiveBiases,
				publishedAt: content.publishedAt,
				sourceType: undefined, // match SourceTypes if known
			} as ArticleAnalyzed);
		} else {
			// If not analyzed yet
			federatedArticles.push({
				id: pointer.cid,
				title: content.title ?? "Untitled",
				url: content.url ?? "",
				content: content.content ?? "",
				analyzed: false,
				source: pointer.source,
				edition: pointer.edition,
				ipfsHash: pointer.cid,
				publishedAt: content.publishedAt,
				sourceType: undefined,
			} as Article);
		}
	}

	// 4️⃣ Load RSS / API feeds (optional)
	const rssArticles: (Article | ArticleAnalyzed)[] = [];
	if (options?.rssFeeds) {
		for (const feed of options.rssFeeds) {
			const articles = await fetchRssFeed(feed);
			rssArticles.push(...articles);
		}
	}

	const apiArticles: (Article | ArticleAnalyzed)[] = [];
	if (options?.apiFeeds) {
		for (const feed of options.apiFeeds) {
			const articles = await fetchApiFeed(feed.url, feed.apiKey);
			apiArticles.push(...articles);
		}
	}

	// 5️⃣ Combine all articles
	const allArticles = [...localArticles, ...federatedArticles, ...rssArticles, ...apiArticles];

	// 6️⃣ Sort by publishedAt descending
	allArticles.sort((a, b) => {
		const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
		const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
		return bTime - aTime;
	});

	return allArticles;
};
