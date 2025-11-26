// frontend/src/p2p/db-articles-analyzed.ts
/**
 * @file OrbitDB setup and DB operations for Nous P2P Node (Analyzed DB)
 * @description
 * Sets up the "nous.analyzed.feed" database in OrbitDB and provides helper
 * functions for saving, deleting, querying, and retrieving AI-analyzed articles.
 */

import { Documents, type OrbitDB } from "@orbitdb/core";
import { addDebugLog, log } from "@/lib/log.server";
import type { ArticleAnalyzed } from "@/types";

/**
 * Interface for the Analyzed DB instance and its helpers
 */
export interface ArticleAnalyzedDB {
	db: any; // OrbitDB instance
	saveArticle: (doc: ArticleAnalyzed) => Promise<void>;
	deleteArticle: (id: string) => Promise<void>;
	getAllArticles: () => Promise<ArticleAnalyzed[]>;
	getArticle: (id: string) => Promise<ArticleAnalyzed | null>;
	queryArticles: (fn: (doc: ArticleAnalyzed) => boolean) => Promise<ArticleAnalyzed[]>;
}

// Singleton instance
let articleAnalyzedDBInstance: ArticleAnalyzedDB | null = null;

/**
 * Sets up the analyzed articles DB in OrbitDB using an existing OrbitDB instance.
 * Safe to call multiple times; returns existing instance if already initialized.
 *
 * This database holds AI-enriched content derived from the source articles,
 * including cognitive bias, sentiment, antithesis, political bias, and other metadata.
 *
 * @param orbitdb - Existing OrbitDB instance
 * @returns Analyzed DB instance with helper methods
 */
export async function setupArticleAnalyzedDB(orbitdb: OrbitDB): Promise<ArticleAnalyzedDB> {
	if (articleAnalyzedDBInstance) {
		log("🟢 Analyzed DB already initialized, skipping setup");
		return articleAnalyzedDBInstance;
	}

	const db = (await orbitdb.open("nous.analyzed.feed", {
		Database: Documents({ indexBy: "id" }) as any, // cast to satisfy TS
		meta: { indexBy: "id" },
	})) as any;

	// Listen for updates from peers
	db.events.on("update", async (entry: any) => {
		const msg = `🔄 Update from peer (analyzed): ${JSON.stringify(entry)}`;
		log(msg);
		await addDebugLog({ message: msg, level: "info" });

		const all = await db.query(() => true);
		const countMsg = `📦 Analyzed articles in DB: ${all.length}`;
		log(countMsg);
		await addDebugLog({ message: countMsg, level: "info" });
	});

	/** Save an analyzed article */
	async function saveAnalyzedArticle(doc: ArticleAnalyzed) {
		await db.put(doc);
		const msg = `Saved analyzed article: ${doc.id}`;
		log(msg);
		await addDebugLog({ message: msg, level: "info" });
	}

	/** Delete an analyzed article by ID */
	async function deleteAnalyzedArticle(id: string) {
		await db.del(id);
		const msg = `Deleted analyzed article: ${id}`;
		log(msg);
		await addDebugLog({ message: msg, level: "info" });
	}

	/** Get all analyzed articles */
	async function getAllAnalyzedArticles(): Promise<ArticleAnalyzed[]> {
		return (await db.query(() => true)) ?? [];
	}

	/** Get a single analyzed article by ID */
	async function getAnalyzedArticle(id: string): Promise<ArticleAnalyzed | null> {
		return (await db.get(id)) ?? null;
	}

	/** Query analyzed articles using a predicate function */
	async function queryAnalyzedArticles(
		fn: (doc: ArticleAnalyzed) => boolean,
	): Promise<ArticleAnalyzed[]> {
		return await db.query(fn);
	}

	// Save singleton
	articleAnalyzedDBInstance = {
		db,
		saveArticle: saveAnalyzedArticle,
		deleteArticle: deleteAnalyzedArticle,
		getAllArticles: getAllAnalyzedArticles,
		getArticle: getAnalyzedArticle,
		queryArticles: queryAnalyzedArticles,
	};
	log(`✅ Analyzed Article DB setup complete with ${db.address?.toString()}`);

	return articleAnalyzedDBInstance;
}
