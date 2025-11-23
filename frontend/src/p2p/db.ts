/**
 * @file OrbitDB setup and DB operations for local and analyzed articles
 * @description
 * Sets up the "local-articles" and "analyzed-articles" databases
 * and provides helper functions for saving, querying, and retrieving articles.
 */

import type { OrbitDB } from "@orbitdb/core";
import type { Article } from "../types/articles";

/**
 * Represents our local and analyzed article databases.
 */
export interface DBs {
	localArticlesDB: any; // OrbitDB Documents DB instance
	analyzedArticlesDB: any;
}

/**
 * Initialize the local and analyzed article databases.
 *
 * @param orbitdb - OrbitDB instance
 * @returns Helper functions and DB instances
 */
export async function initDBs(orbitdb: OrbitDB): Promise<
	DBs & {
		saveLocalArticle: (doc: Article) => Promise<void>;
		saveAnalyzedArticle: (doc: Article) => Promise<void>;
		getAllLocalArticles: () => Promise<Article[]>;
		getAllAnalyzedArticles: () => Promise<Article[]>;
	}
> {
	// --- Open / create local articles DB ---
	const localArticlesDB = (await orbitdb.open("local-articles", {
		type: "documents",
		meta: { indexBy: "url" },
	})) as any;

	// --- Open / create analyzed articles DB ---
	const analyzedArticlesDB = (await orbitdb.open("analyzed-articles", {
		type: "documents",
		meta: { indexBy: "url" },
	})) as any;

	console.log(`Local DB: ${localArticlesDB.address}`);
	console.log(`Analyzed DB: ${analyzedArticlesDB.address}`);

	// --- Optional update logging ---
	localArticlesDB.events.on("update", async (entry: any) =>
		console.log(`📝 Local article updated: ${JSON.stringify(entry)}`),
	);
	analyzedArticlesDB.events.on("update", async (entry: any) =>
		console.log(`🧠 Analyzed article updated: ${JSON.stringify(entry)}`),
	);

	// --- DB Operations ---

	/**
	 * Save an article to the local articles DB
	 * @param doc Article to save
	 */
	async function saveLocalArticle(doc: Article) {
		await localArticlesDB.put({ ...doc, tags: doc.tags?.join(",") ?? "" });
		console.log(`Saved local article: ${doc.url}`);
	}

	/**
	 * Save an article to the analyzed articles DB
	 * @param doc Article to save
	 */
	async function saveAnalyzedArticle(doc: Article) {
		await analyzedArticlesDB.put({ ...doc, tags: doc.tags?.join(",") ?? "" });
		console.log(`Saved analyzed article: ${doc.url}`);
	}

	/**
	 * Get all local articles
	 */
	async function getAllLocalArticles(): Promise<Article[]> {
		const docs = localArticlesDB.query(() => true) ?? [];
		return docs.map((doc: Article & { tags: string }) => ({
			...doc,
			tags: typeof doc.tags === "string" ? doc.tags.split(",") : doc.tags,
		}));
	}

	/**
	 * Get all analyzed articles
	 */
	async function getAllAnalyzedArticles(): Promise<Article[]> {
		const docs = analyzedArticlesDB.query(() => true) ?? [];
		return docs.map((doc: Article & { tags: string }) => ({
			...doc,
			tags: typeof doc.tags === "string" ? doc.tags.split(",") : doc.tags,
		}));
	}

	return {
		localArticlesDB,
		analyzedArticlesDB,
		saveLocalArticle,
		saveAnalyzedArticle,
		getAllLocalArticles,
		getAllAnalyzedArticles,
	};
}
