// frontend/src/p2p/db-analyzed.ts
/**
 * @file OrbitDB setup and DB operations for Nous P2P Node (Analyzed DB)
 * @description
 * Sets up the "nous.analyzed.feed" database in OrbitDB and provides helper
 * functions for saving, deleting, querying, and retrieving AI-analyzed articles.
 */

import type { OrbitDB } from "@orbitdb/core";
import { addDebugLog, log } from "@/lib/log";
import type { ArticleAnalyzed } from "../types";

/**
 * Sets up the analyzed articles DB in OrbitDB using an existing OrbitDB instance.
 *
 * This database holds AI-enriched content derived from the source articles,
 * including cognitive bias, sentiment, antithesis, political bias, and other metadata.
 *
 * @param orbitdb - Existing OrbitDB instance to avoid lock conflicts
 * @returns Helper functions and DB instance
 */
export async function setupAnalyzedDB(orbitdb: OrbitDB) {
	// --- Open / create the analyzed feed DB ---
	const db = (await orbitdb.open("nous.analyzed.feed", {
		type: "documents",
		meta: { indexBy: "id" }, // index by unique analyzed article id
	})) as any;

	// --- Optional update logging ---
	db.events.on("update", async (entry: any) => {
		log(`🔄 Update from peer (analyzed): ${JSON.stringify(entry)}`);
		await addDebugLog({
			message: `🔄 Update from peer (analyzed): ${JSON.stringify(entry)}`,
			level: "info",
			meta: { pointer: JSON.stringify(entry) },
			type: "analyzed",
		});

		const all = await db.query(() => true);
		log(`📦 Analyzed articles in DB: ${all.length}`);
		await addDebugLog({
			message: `📦 Analyzed articles in DB: ${all.length}`,
			level: "info",
			meta: { length: all.length },
			type: "analyzed",
		});
	});

	// --- DB Operations ---

	/**
	 * Save an analyzed article to the DB
	 * Updates node status before and after the operation
	 *
	 * @param {ArticleAnalyzed} doc - Analyzed article to save
	 */
	async function saveArticle(doc: ArticleAnalyzed) {
		await db.put(doc);
		log(`Saved analyzed article: ${doc.id}`);
		await addDebugLog({
			message: `Saved analyzed article: ${doc.id}`,
			level: "info",
			meta: { length: doc.id },
			type: "analyzed",
		});
	}

	/**
	 * Delete an analyzed article from the DB by ID
	 * Updates node status before and after the operation
	 *
	 * @param {string} id - Analyzed article ID
	 */
	async function deleteArticle(id: string) {
		await db.del(id);
		log(`Deleted analyzed article: ${id}`);
		await addDebugLog({
			message: `Deleted analyzed article: ${id}`,
			level: "info",
			meta: { id },
			type: "analyzed",
		});
	}

	/**
	 * Get all analyzed articles from the DB
	 *
	 * @returns {Promise<ArticleAnalyzed[]>} Array of analyzed articles
	 */
	async function getAllArticles(): Promise<ArticleAnalyzed[]> {
		return db.query(() => true) ?? [];
	}

	/**
	 * Get a single analyzed article by ID
	 *
	 * @param {string} id - Article ID
	 * @returns {Promise<ArticleAnalyzed | null>} Article or null if not found
	 */
	async function getArticle(id: string): Promise<ArticleAnalyzed | null> {
		return db.get(id) ?? null;
	}

	/**
	 * Query analyzed articles with a custom filter function
	 *
	 * @param {(doc: ArticleAnalyzed) => boolean} fn - Filter function
	 * @returns {Promise<ArticleAnalyzed[]>} Array of matching analyzed articles
	 */
	async function queryArticles(fn: (doc: ArticleAnalyzed) => boolean): Promise<ArticleAnalyzed[]> {
		return db.query(fn);
	}

	// --- Return DB + helpers ---
	return {
		db,
		saveArticle,
		deleteArticle,
		getAllArticles,
		getArticle,
		queryArticles,
	};
}
