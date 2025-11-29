// frontend/src/p2p/db-articles-local.ts
import { Documents, IPFSAccessController, type OrbitDB } from "@orbitdb/core";
import type { Helia } from "helia";
import { smartFetch } from "@/lib/fetch.server";
import { addDebugLog, log } from "@/lib/log.server";
import { getNormalizer, normalizePublishedAt } from "@/lib/normalizers";
import { cleanArticlesForDB, getParser } from "@/lib/parsers";
import type { ArticleAnalyzed, Source } from "@/types";
import { type Article, ArticleSchema } from "@/types/article";
import { fetchArticleFromIPFS, saveArticleToIPFS, saveJSONToIPFS } from "./lib/ipfs.server";
import { loadDBPaths, saveDBPaths } from "./setup";

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

	/**
	 * Loads the full article content using a 3-tier resolution strategy
	 */
	getFullLocalArticle: (article: Article, helia: Helia) => Promise<Article | ArticleAnalyzed>;
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

	const savedPaths = loadDBPaths();
	const dbName = savedPaths.articles ?? "nous.articles.feed";

	const db = (await orbitdb.open(dbName, {
		Database: Documents({ indexBy: "url" }) as any, // cast to satisfy TS
		AccessController: IPFSAccessController({ write: ["*"] }),
		meta: { indexBy: "url" },
	})) as any;

	// Save back path for future loads
	saveDBPaths({ ...savedPaths, articles: db.address.toString() });

	// Listen for peer updates
	db.events.on("update", async (entry: any) => {
		const msg = `🔄 Article Local update from peer: ${JSON.stringify(entry)}`;
		// log(JSON.stringify(msg, null, 2));
		await addDebugLog({ message: msg, level: "info" });

		const all = await db.query(() => true);
		const countMsg = `📦 Articles in sources DB: ${all.length}`;
		// log(countMsg);
		await addDebugLog({ message: countMsg, level: "info" });
	});

	// Listen for peer database replications
	db.events.on("replicated", (address: string) => {
		console.log("🔄 Local DB replicated from peer", address);
	});

	/**
	 * Save a single article if it does not exist
	 * @param doc - Article to save
	 */
	async function saveLocalArticle(doc: Article, helia?: Helia) {
		const exists = await db.get(doc.url);
		if (exists) {
			log(`Skipping duplicate article: ${doc.id} / ${doc.url}`);
			return;
		}

		// Add content to IPFS if Helia provided
		if (helia && doc.content && !doc.ipfsHash) {
			try {
				const cid = await saveArticleToIPFS(helia, doc);
				if (cid) doc.ipfsHash = cid;
			} catch (err) {
				log(`Failed to add content to IPFS for ${doc.url}: ${(err as Error).message}`, "warn");
			}
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
		if (sources && sources.length > 0) {
			const enabledEndpoints = new Set(sources.filter((s) => s.enabled).map((s) => s.endpoint));
			articles = articles.filter((a: Article) => enabledEndpoints.has(a.source || ""));
		}
		return articles;
	}

	/**
	 * Get a single article by URL, ID, or IPFS CID
	 * @param identifier - The article's URL, internal ID, or IPFS CID
	 */
	async function getLocalArticle(identifier: string): Promise<Article | null> {
		// 1️⃣ Try direct lookup by URL
		const article = await db.get(identifier);
		if (article) return article;

		// 2️⃣ Fallback: query by ID or IPFS CID
		const results: Article[] = await db.query(
			(doc: Article) => doc.id === identifier || doc.ipfsHash === identifier,
		);

		return results.length > 0 ? results[0] : null;
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

	/**
	 * Load full article content using a 3-tier resolution strategy:
	 *   1. Use content already on the article object
	 *   2. Load full Article from IPFS via article.ipfsHash
	 *   3. Fetch from the source endpoint, store raw, content, summary, and save to IPFS + OrbitDB
	 *
	 * Cached results are always stored back into OrbitDB.
	 *
	 * @async
	 * @param helia - Active Helia node
	 * @param article - Article metadata (may or may not include content)
	 * @param fetchFromSource - Optional function to fetch full content from the source URL
	 * @param summarizeContent - Optional function to generate a summary from full content
	 * @param saveLocalArticle - Function to save to OrbitDB
	 * @returns Article with guaranteed `.content` and `.summary` if retrievable
	 */
	async function getFullLocalArticle(
		article: Article,
		helia: Helia,
		fetchFromSource?: (url: string) => Promise<string>,
		summarizeContent?: (text: string) => Promise<string>,
		saveLocalArticle?: (article: Article | ArticleAnalyzed, helia?: Helia) => Promise<void>,
	): Promise<Article | ArticleAnalyzed> {
		// 1️⃣ Already have content?
		if (article.content && article.summary) return article;

		// 2️⃣ Try loading full Article from IPFS
		if (article.ipfsHash) {
			try {
				const fetched = await fetchArticleFromIPFS(helia, article.ipfsHash);
				if (fetched) {
					if (saveLocalArticle) await saveLocalArticle(fetched, helia);
					return fetched;
				}
			} catch (err) {
				log(`IPFS load failed for ${article.id}: ${(err as Error).message}`, "warn");
			}
		}

		// 3️⃣ Fetch from source URL if missing content
		if (fetchFromSource && article.url) {
			try {
				const rawContent = await fetchFromSource(article.url);
				if (rawContent) {
					const updated: Article = {
						...article,
						raw: rawContent,
						content: rawContent, // could add extraction logic if needed
						summary: summarizeContent ? await summarizeContent(rawContent) : undefined,
						fetchedAt: new Date().toISOString(),
					};

					// Save updated Article to IPFS
					if (helia && updated.content) {
						try {
							const cid = await saveArticleToIPFS(helia, updated);
							updated.ipfsHash = cid;
						} catch (err) {
							log(
								`Failed to save Article to IPFS for ${article.id}: ${(err as Error).message}`,
								"warn",
							);
						}
					}

					// Save updated Article to OrbitDB
					if (saveLocalArticle) await saveLocalArticle(updated, helia);

					return updated;
				}
			} catch (err) {
				log(`Network fetch failed for article ${article.id}: ${(err as Error).message}`, "warn");
			}
		}

		// 4️⃣ Return original if nothing worked
		return article;
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
		getFullLocalArticle,
	};

	log(`✅ Local Article DB setup complete with ${db.address?.toString()}`);

	return articleLocalDBInstance;
}
