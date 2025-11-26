// frontend/src/p2p/db-articles-local.ts
import { Documents, type OrbitDB } from "@orbitdb/core";
import { smartFetch } from "@/lib/fetch.server";
import { addDebugLog, log } from "@/lib/log.server";
import { getNormalizer, normalizePublishedAt } from "@/lib/normalizers";
import { cleanArticlesForDB, getParser } from "@/lib/parsers";
import type { Source } from "@/types";
import { type Article, ArticleSchema } from "@/types/article";

/**
 * Explicit type for the local articles DB instance
 */
export interface ArticleLocalDB {
	articleLocalDB: any; // OrbitDB instance (type-safe document DB typing is difficult)

	/**
	 * Save a single article to the DB if it does not already exist
	 */
	saveLocalArticle: (doc: Article) => Promise<void>;

	/**
	 * Delete a single article by URL
	 */
	deleteLocalArticle: (url: string) => Promise<void>;

	/**
	 * Get all articles. Optionally filter by enabled sources.
	 */
	getAllLocalArticles: (sources?: Source[]) => Promise<Article[]>;

	/**
	 * Get a single article by URL
	 */
	getLocalArticle: (url: string) => Promise<Article | null>;

	/**
	 * Query articles using a custom predicate
	 */
	queryLocalArticles: (fn: (doc: Article) => boolean) => Promise<Article[]>;

	/**
	 * Add multiple articles, skipping duplicates
	 */
	addUniqueLocalArticles: (articles: Article[]) => Promise<number>;

	/**
	 * Fetch articles from external sources.
	 * Returns both fetched articles and per-source errors.
	 */
	fetchAllLocalSources: (sources: Source[]) => Promise<{
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
		log("🟢 Article Local DB already initialized, skipping setup");
		return articleLocalDBInstance;
	}

	const db = (await orbitdb.open("nous.articles.feed", {
		Database: Documents({ indexBy: "url" }) as any, // cast to satisfy TS
		meta: { indexBy: "url" },
	})) as any;

	// Listen for peer updates
	db.events.on("update", async (entry: any) => {
		const msg = `🔄 Article Local Update from peer: ${JSON.stringify(entry)}`;
		// log(JSON.stringify(msg, null, 2));
		await addDebugLog({ message: msg, level: "info" });

		const all = await db.query(() => true);
		const countMsg = `📦 Articles in sources DB: ${all.length}`;
		// log(countMsg);
		await addDebugLog({ message: countMsg, level: "info" });
	});

	/**
	 * Save a single article if it does not exist
	 * @param doc - Article to save
	 */
	async function saveLocalArticle(doc: Article) {
		const exists = await db.get(doc.url);
		if (exists) {
			log(`Skipping duplicate article: ${doc.id} / ${doc.url}`);
			return;
		}
		await db.put(doc);
		const msg = `Saved to local DB: ${doc.id} / ${doc.url}`;
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
	 * Fetch articles from enabled sources, parse and normalize them,
	 * validate against the Article schema, and collect any per-source errors.
	 *
	 * @param availableSources - Array of sources to fetch from
	 * @returns Object containing normalized articles and an array of per-source errors
	 */
	async function fetchAllLocalSources(
		availableSources: Source[],
	): Promise<{ articles: Article[]; errors: { endpoint: string; error: string }[] }> {
		const enabledSources = availableSources.filter((s) => s.enabled);
		const allArticles: Article[] = [];
		const errors: { endpoint: string; error: string }[] = [];

		for (const source of enabledSources) {
			try {
				log(`Fetching articles from source: ${source.endpoint}`);
				const response = await smartFetch(source.endpoint);

				if (!response.ok) {
					const msg = `Failed to fetch from ${source.endpoint}: HTTP ${response.status}`;
					log(msg, "warn");
					errors.push({ endpoint: source.endpoint, error: msg });
					continue;
				}

				const rawData = await response.json();

				// Get parser and normalizer for this source
				const parserFn = getParser(source);
				const normalizerFn = getNormalizer(source);

				// Parse raw data into intermediate articles
				const parsedArticles = parserFn(rawData, source);

				if (!Array.isArray(parsedArticles)) {
					const msg = `Parser did not return an array of articles for ${source.endpoint}`;
					log(msg, "warn");
					errors.push({ endpoint: source.endpoint, error: msg });
					continue;
				}

				// Normalize parsed articles
				const normalizedArticles: Article[] = parsedArticles.map((a) => {
					const n = normalizerFn(a, source);
					n.publishedAt = normalizePublishedAt(n.publishedAt);
					return n;
				});

				// Clean undefined values before storing in OrbitDB
				const cleanArticles = cleanArticlesForDB(normalizedArticles);

				// Validate normalized articles
				for (const article of cleanArticles) {
					try {
						ArticleSchema.parse(article);
						allArticles.push(article);
					} catch (err) {
						const msg = `Invalid article structure from ${source.endpoint}: ${(err as Error).message}`;
						log(msg, "warn");
						errors.push({ endpoint: source.endpoint, error: msg });
					}
				}

				log(`Fetched ${cleanArticles.length} articles from ${source.endpoint}`);
			} catch (err) {
				const msg = (err as Error).message;
				log(`Error fetching from ${source.endpoint}: ${msg}`, "error");
				errors.push({ endpoint: source.endpoint, error: msg });
			}
		}

		log(`Total articles fetched from all sources: ${allArticles.length}`);
		return { articles: allArticles, errors };
	}

	/**
	 * Get all articles, optionally filtered by enabled sources
	 * @param sources Optional array of sources to filter by endpoint
	 */
	async function getAllLocalArticles(sources?: Source[]): Promise<Article[]> {
		let articles = (await db.query(() => true)) ?? [];
		log(`getAllLocalArticles: ${JSON.stringify(articles, null, 2)}`);
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
		articleLocalDB: db,
		saveLocalArticle,
		deleteLocalArticle,
		getAllLocalArticles,
		getLocalArticle,
		queryLocalArticles,
		addUniqueLocalArticles,
		fetchAllLocalSources,
	};

	log(`✅ Local Article DB setup complete with ${db.address?.toString()}`);

	return articleLocalDBInstance;
}
