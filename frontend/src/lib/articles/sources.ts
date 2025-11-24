// frontend/src/lib/articles/sources.ts
import fetch from "node-fetch";
import Parser from "rss-parser";
import { type Article, ArticleSchema } from "@/types";

const rssParser = new Parser();

/**
 * Fetch articles from a standard RSS feed.
 *
 * @param url - URL of the RSS feed
 * @returns Array of parsed Article objects
 */
export const fetchRssFeed = async (url: string): Promise<Article[]> => {
	try {
		const feed = await rssParser.parseURL(url);

		const articles = feed.items.map((item) => {
			const article = {
				id: item.guid || item.link || crypto.randomUUID(),
				url: item.link ?? "",
				title: item.title ?? "No title",
				content: item.contentSnippet ?? item.content ?? "",
				analyzed: false,
				sourceDomain: item.link ? new URL(item.link).hostname : "unknown",
				publishedAt: item.pubDate,
			};
			return ArticleSchema.parse(article);
		});

		return articles;
	} catch (err) {
		console.error("Failed to fetch RSS feed:", url, err);
		return [];
	}
};

/**
 * Fetch articles from a JSON API.
 *
 * @param url - API endpoint returning JSON containing `articles` array
 * @param apiKey - Optional API key for authorization header
 * @returns Array of parsed Article objects
 */
export const fetchApiFeed = async (url: string, apiKey?: string): Promise<Article[]> => {
	try {
		const res = await fetch(url, {
			headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
		});

		// Explicitly type data as unknown
		const data: unknown = await res.json();

		// Normalize and parse articles
		const articles: Article[] = (
			Array.isArray((data as any).articles) ? (data as any).articles : []
		).map((item: any) => {
			const article = {
				id: item.id ?? crypto.randomUUID(),
				url: item.url,
				title: item.title,
				content: item.content ?? "",
				analyzed: false,
				sourceDomain: item.source ?? "",
				publishedAt: item.publishedAt,
			};
			return ArticleSchema.parse(article);
		});

		return articles;
	} catch (err) {
		console.error("Failed to fetch API feed:", url, err);
		return [];
	}
};

/**
 * Fetch multiple RSS feeds concurrently.
 *
 * @param urls - Array of RSS feed URLs
 * @returns Flattened array of parsed articles from all feeds
 */
export const fetchMultipleRssFeeds = async (urls: string[]): Promise<Article[]> => {
	const results = await Promise.all(urls.map(fetchRssFeed));
	return results.flat();
};

/**
 * Fetch multiple API feeds concurrently.
 *
 * @param feeds - Array of objects { url, apiKey }
 * @returns Flattened array of parsed articles from all feeds
 */
export const fetchMultipleApiFeeds = async (
	feeds: { url: string; apiKey?: string }[],
): Promise<Article[]> => {
	const results = await Promise.all(feeds.map((f) => fetchApiFeed(f.url, f.apiKey)));
	return results.flat();
};

/**
 * Normalize a raw article object from an unknown source.
 * Ensures required fields exist and sets defaults for optional fields.
 *
 * @param raw - Raw article object
 * @returns Parsed Article or null if invalid
 */
export const normalizeArticle = (raw: unknown): Article | null => {
	try {
		const article = ArticleSchema.parse(raw);
		return article;
	} catch (err) {
		console.warn("Failed to normalize article:", raw, err);
		return null;
	}
};
