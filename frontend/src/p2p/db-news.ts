/**
 * @file OrbitDB setup and DB operations for Nous P2P Node
 * @description
 * Sets up the "nous.news.feed" database and provides helper
 * functions for saving, deleting, querying, and retrieving articles.
 */

import type { OrbitDB } from "@orbitdb/core";
import { log, updateStatus } from "../lib/utils";
import type { Article, NodeStatus } from "../types";

/**
 * Sets up the news DB in OrbitDB using an existing OrbitDB instance.
 *
 * @param orbitdb - Existing OrbitDB instance to avoid lock conflicts
 * @param status - Node status object for syncing updates
 * @returns Helper functions and DB instance
 */
export async function setupDB(orbitdb: OrbitDB, status: NodeStatus) {
	// --- Open / create the news feed DB ---
	const newsDB = (await orbitdb.open("nous.news.feed", {
		type: "documents",
		meta: { indexBy: "url" },
	})) as any;

	// --- Optional update logging ---
	newsDB.events.on("update", async (entry: any) => {
		log(`🔄 Update from peer: ${JSON.stringify(entry)}`);
		const all = await newsDB.query(() => true);
		log(`📦 Articles in DB: ${all.length}`);
	});

	// --- DB Operations ---

	/**
	 * Save an article to the news DB
	 * Updates node status before and after the operation
	 *
	 * @param {Article} doc - Article to save
	 */
	async function saveArticle(doc: Article) {
		updateStatus(status, true, true);
		await newsDB.put(doc);
		log(`Saved: ${doc.url}`);
		updateStatus(status, true, false);
	}

	/**
	 * Delete an article from the news DB by URL
	 * Updates node status before and after the operation
	 *
	 * @param {string} url - Article URL
	 */
	async function deleteArticle(url: string) {
		updateStatus(status, true, true);
		await newsDB.del(url);
		log(`Deleted: ${url}`);
		updateStatus(status, true, false);
	}

	/**
	 * Get all articles from the news DB
	 *
	 * @returns {Promise<Article[]>} Array of articles
	 */
	async function getAllArticles(): Promise<Article[]> {
		return newsDB.query(() => true) ?? [];
	}

	/**
	 * Get a single article by URL
	 *
	 * @param {string} url - Article URL
	 * @returns {Promise<Article | null>} Article or null if not found
	 */
	async function getArticle(url: string): Promise<Article | null> {
		return newsDB.get(url) ?? null;
	}

	/**
	 * Query articles with a custom filter function
	 *
	 * @param {(doc: Article) => boolean} fn - Filter function
	 * @returns {Promise<Article[]>} Array of matching articles
	 */
	async function queryArticles(fn: (doc: Article) => boolean): Promise<Article[]> {
		return newsDB.query(fn);
	}

	/**
	 * Get the current node status
	 *
	 * @returns {NodeStatus} Node status object
	 */
	function getStatus(): NodeStatus {
		return status;
	}

	return {
		newsDB,
		saveArticle,
		deleteArticle,
		getAllArticles,
		getArticle,
		queryArticles,
		getStatus,
	};
}
