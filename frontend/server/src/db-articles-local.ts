// frontend/src/p2p/db-articles-local.ts
import type { OrbitDB } from "@orbitdb/core";
import { addDebugLog, log } from "@/lib/log.server";
import type { Source } from "@/types";
import { type Article, ArticleSchema } from "@/types/article";

/**
 * Explicit type for the local articles DB instance
 */
export interface ArticleLocalDB {
	db: any; // OrbitDB instance (type-safe document DB typing is difficult)

	/**
	 * Save a single article to the DB if it does not already exist
	 */
	saveArticle: (doc: Article) => Promise<void>;

	/**
	 * Delete a single article by URL
	 */
	deleteArticle: (url: string) => Promise<void>;

	/**
	 * Get all articles. Optionally filter by enabled sources.
	 */
	getAllArticles: (sources?: Source[]) => Promise<Article[]>;

	/**
	 * Get a single article by URL
	 */
	getArticle: (url: string) => Promise<Article | null>;

	/**
	 * Query articles using a custom predicate
	 */
	queryArticles: (fn: (doc: Article) => boolean) => Promise<Article[]>;

	/**
	 * Add multiple articles, skipping duplicates
	 */
	addUniqueArticles: (articles: Article[]) => Promise<number>;

	/**
	 * Fetch articles from external sources.
	 * Returns both fetched articles and per-source errors.
	 */
	fetchAllSources: (sources: Source[]) => Promise<{
		articles: Article[];
		errors: { endpoint: string; error: string }[];
	}>;
}

// Singleton instance
let articleLocalDBInstance: ArticleLocalDB | null = null;

/**
 * Sets up the articles local DB in OrbitDB using an existing OrbitDB instance.
 * Safe to call multiple times; returns existing instance if already initialized.
 *
 * @param orbitdb - Existing OrbitDB instance.
 * @returns DB instance and helper methods for articles (unanalyzed) management.
 */
export async function setupArticleLocalDB(orbitdb: OrbitDB): Promise<ArticleLocalDB> {
	if (articleLocalDBInstance) {
		log("🟢 Article Source DB already initialized, skipping setup");
		return articleLocalDBInstance;
	}

	const db = (await orbitdb.open("nous.articles.feed", {
		type: "documents",
		meta: { indexBy: "url" },
	})) as any;

	// Listen for peer updates
	db.events.on("update", async (entry: any) => {
		const msg = `🔄 Update from peer: ${JSON.stringify(entry)}`;
		log(msg);
		await addDebugLog({ message: msg, level: "info" });

		const all = await db.query(() => true);
		const countMsg = `📦 Articles in sources DB: ${all.length}`;
		log(countMsg);
		await addDebugLog({ message: countMsg, level: "info" });
	});

	/**
	 * Save a single article if it does not exist
	 * @param doc - Article to save
	 */
	async function saveLocalArticle(doc: Article) {
		const exists = await db.get(doc.url);
		if (exists) {
			log(`Skipping duplicate article: ${doc.url}`);
			return;
		}
		await db.put(doc);
		const msg = `Saved to sources DB: ${doc.url}`;
		log(msg);
		await addDebugLog({ message: msg, level: "info" });
	}

	/**
	 * Delete a single article by URL
	 * @param url - Article URL to delete
	 */
	async function deleteLocalArticle(url: string) {
		await db.del(url);
		const msg = `Deleted from sources DB: ${url}`;
		log(msg);
		await addDebugLog({ message: msg, level: "info" });
	}

	/**
	 * Fetch articles from enabled sources with validation and error collection
	 * @param availableSources - Array of Source objects
	 * @returns Object containing articles and per-source errors
	 */
	async function fetchAllLocalSources(availableSources: Source[]) {
		const enabledSources = availableSources.filter((s) => s.enabled);
		const allArticles: Article[] = [];
		const errors: { endpoint: string; error: string }[] = [];

		for (const source of enabledSources) {
			try {
				log(`Fetching articles from source: ${source.endpoint}`);
				const response = await fetch(source.endpoint);

				if (!response.ok) {
					const msg = `Failed to fetch from ${source.endpoint}: HTTP ${response.status}`;
					log(msg, "info");
					errors.push({ endpoint: source.endpoint, error: msg });
					continue;
				}

				const rawArticles = await response.json();
				if (!Array.isArray(rawArticles)) {
					const msg = `Invalid response format from ${source.endpoint}`;
					log(msg, "warn");
					errors.push({ endpoint: source.endpoint, error: msg });
					continue;
				}

				// Validate each article against ArticleSchema
				for (const a of rawArticles) {
					try {
						const validated = ArticleSchema.parse(a);
						allArticles.push(validated);
					} catch (err) {
						const msg = `Invalid article structure from ${source.endpoint}`;
						log(msg, "warn");
						errors.push({ endpoint: source.endpoint, error: `${msg}: ${(err as Error).message}` });
					}
				}

				log(`Fetched ${allArticles.length} valid articles from ${source.endpoint}`, "info");
			} catch (err) {
				const msg = (err as Error).message;
				log(`Error fetching from ${source.endpoint}: ${msg}`, "error");
				errors.push({ endpoint: source.endpoint, error: msg });
			}
		}

		log(`Total articles fetched from all sources: ${allArticles.length}`, "info");
		return { articles: allArticles, errors };
	}

	/**
	 * Get all articles, optionally filtered by enabled sources
	 * @param sources Optional array of sources to filter by endpoint
	 */
	async function getAllLocalArticles(sources?: Source[]): Promise<Article[]> {
		let articles = (await db.query(() => true)) ?? [];
		if (sources && sources.length > 0) {
			const enabledEndpoints = new Set(sources.filter((s) => s.enabled).map((s) => s.endpoint));
			articles = articles.filter((a: Article) => enabledEndpoints.has(a.source || ""));
		}
		return articles;
	}

	/**
	 * Get a single article by URL
	 * @param url - URL of the article
	 */
	async function getLocalArticle(url: string): Promise<Article | null> {
		return (await db.get(url)) ?? null;
	}

	/**
	 * Query articles using a custom predicate
	 * @param fn Predicate function
	 */
	async function queryLocalArticles(fn: (doc: Article) => boolean): Promise<Article[]> {
		return await db.query(fn);
	}

	/**
	 * Add multiple articles, skipping duplicates
	 * @param newArticles Array of articles to add
	 */
	async function addUniqueLocalArticles(newArticles: Article[]): Promise<number> {
		let added = 0;
		for (const article of newArticles) {
			const exists = await db.get(article.url);
			if (!exists) {
				await saveLocalArticle(article);
				added++;
			} else {
				log(`Skipped existing article: ${article.url}`);
			}
		}
		return added;
	}

	// Save singleton
	articleLocalDBInstance = {
		db,
		saveArticle: saveLocalArticle,
		deleteArticle: deleteLocalArticle,
		getAllArticles: getAllLocalArticles,
		getArticle: getLocalArticle,
		queryArticles: queryLocalArticles,
		addUniqueArticles: addUniqueLocalArticles,
		fetchAllSources: fetchAllLocalSources,
	};

	log(`✅ Local Article DB setup complete with ${db.address?.toString()}`);

	return articleLocalDBInstance;
}
