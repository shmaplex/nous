// frontend/src/p2p/db-sources.ts
import type { OrbitDB } from "@orbitdb/core";
import { addDebugLog, log } from "@/lib/log.server";
import type { Article, Source } from "@/types";

/**
 * Explicit type for the sources DB instance
 */
export interface SourceDB {
	db: any; // OrbitDB instance (type-safe document DB typing is difficult)
	saveArticle: (doc: Article) => Promise<void>;
	deleteArticle: (url: string) => Promise<void>;
	getAllArticles: () => Promise<Article[]>;
	getArticle: (url: string) => Promise<Article | null>;
	queryArticles: (fn: (doc: Article) => boolean) => Promise<Article[]>;
	addUniqueArticles: (articles: Article[]) => Promise<number>;
	fetchAllSources: (sources: Source[]) => Promise<Article[]>;
}

// Singleton instance
let sourceDBInstance: SourceDB | null = null;

/**
 * Sets up the sources DB in OrbitDB using an existing OrbitDB instance.
 * Safe to call multiple times; returns existing instance if already initialized.
 *
 * @param orbitdb - Existing OrbitDB instance.
 * @returns DB instance and helper methods for sources management.
 */
export async function setupSourcesDB(orbitdb: OrbitDB): Promise<SourceDB> {
	if (sourceDBInstance) {
		log("🟢 Article Source DB already initialized, skipping setup");
		return sourceDBInstance;
	}

	const db = (await orbitdb.open("nous.sources.feed", {
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

	/** Save a new article if it does not exist */
	async function saveArticle(doc: Article) {
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

	/** Delete an article by URL */
	async function deleteArticle(url: string) {
		await db.del(url);
		const msg = `Deleted from sources DB: ${url}`;
		log(msg);
		await addDebugLog({ message: msg, level: "info" });
	}

	/** Fetch articles from enabled sources */
	async function fetchAllSources(availableSources: Source[]): Promise<Article[]> {
		const enabledSources = availableSources.filter((s) => s.enabled);
		const allArticles: Article[] = [];

		for (const source of enabledSources) {
			try {
				log(`Fetching articles from source: ${source.endpoint}`);
				const response = await fetch(source.endpoint);

				if (!response.ok) {
					log(`Failed to fetch from ${source.endpoint}: HTTP ${response.status}`, "info");
					continue;
				}

				const articles: Article[] = await response.json();
				if (!Array.isArray(articles)) {
					log(`Invalid response format from ${source.endpoint}`, "warn");
					continue;
				}

				allArticles.push(...articles);
				log(`Fetched ${articles.length} articles from ${source.endpoint}`, "info");
			} catch (err) {
				log(`Error fetching from ${source.endpoint}: ${(err as Error).message}`, "error");
			}
		}

		log(`Total articles fetched from all sources: ${allArticles.length}`, "info");
		return allArticles;
	}

	/** Get all articles */
	async function getAllArticles(): Promise<Article[]> {
		return (await db.query(() => true)) ?? [];
	}

	/** Get a single article by URL */
	async function getArticle(url: string): Promise<Article | null> {
		return (await db.get(url)) ?? null;
	}

	/** Query articles using a custom predicate */
	async function queryArticles(fn: (doc: Article) => boolean): Promise<Article[]> {
		return await db.query(fn);
	}

	/** Add multiple articles, skipping duplicates */
	async function addUniqueArticles(newArticles: Article[]): Promise<number> {
		let added = 0;
		for (const article of newArticles) {
			const exists = await db.get(article.url);
			if (!exists) {
				await saveArticle(article);
				added++;
			} else {
				log(`Skipped existing article: ${article.url}`);
			}
		}
		return added;
	}

	// Save singleton
	sourceDBInstance = {
		db,
		saveArticle,
		deleteArticle,
		getAllArticles,
		getArticle,
		queryArticles,
		addUniqueArticles,
		fetchAllSources,
	};

	log(`✅ Sources DB setup complete with ${db.address?.toString()}`);

	return sourceDBInstance;
}
