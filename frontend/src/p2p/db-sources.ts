import type { OrbitDB } from "@orbitdb/core";
import { addDebugLog, log, updateStatus } from "@/lib/log";
import type { Article, NodeStatus } from "../types";

/**
 * Sets up the sources DB in OrbitDB using an existing OrbitDB instance.
 *
 * This database is intended to hold raw news articles fetched from sources,
 * separate from analyzed content or federated pointers.
 *
 * @param orbitdb - The existing OrbitDB instance to avoid lock conflicts.
 * @param status - Node status object used to track syncing/loading state.
 * @returns An object containing DB instance and helper methods:
 * - `db`: The underlying OrbitDB database instance.
 * - `saveArticle(doc: Article)`: Saves a new article if it does not exist.
 * - `deleteArticle(url: string)`: Deletes an article by URL.
 * - `getAllArticles()`: Returns all articles in the DB.
 * - `getArticle(url: string)`: Retrieves a single article by URL.
 * - `queryArticles(fn: (doc: Article) => boolean)`: Filters articles using a custom predicate.
 * - `refetchArticles(newArticles: Article[])`: Adds multiple articles, skipping duplicates.
 * - `getStatus()`: Returns the current node status.
 */
export async function setupSourcesDB(orbitdb: OrbitDB, status: NodeStatus) {
	const db = (await orbitdb.open("nous.sources.feed", {
		type: "documents",
		meta: { indexBy: "url" },
	})) as any;

	// Log updates from peers
	db.events.on("update", async (entry: any) => {
		log(`🔄 Update from peer: ${JSON.stringify(entry)}`);
		await addDebugLog({
			message: `🔄 Update from peer: ${JSON.stringify(entry)}`,
			level: "info",
			type: "source",
		});
		const all = await db.query(() => true);
		log(`📦 Articles in sources DB: ${all.length}`);
		await addDebugLog({
			message: `📦 Articles in sources DB: ${all.length}`,
			level: "info",
			type: "source",
		});
	});

	/**
	 * Save a new article to the sources DB if it does not already exist.
	 *
	 * @param {Article} doc - Article object to save.
	 */
	async function saveArticle(doc: Article) {
		const exists = await db.get(doc.url);
		if (exists) {
			log(`Skipping duplicate article: ${doc.url}`);
			return;
		}
		updateStatus(status, true, true);
		await db.put(doc);
		log(`Saved to sources DB: ${doc.url}`);
		await addDebugLog({
			message: `Saved to sources DB: ${doc.url}`,
			level: "info",
			meta: { url: doc.url },
			type: "source",
		});
		updateStatus(status, true, false);
	}

	/**
	 * Delete an article from the sources DB by its URL.
	 *
	 * @param {string} url - The URL of the article to delete.
	 */
	async function deleteArticle(url: string) {
		updateStatus(status, true, true);
		await db.del(url);
		log(`Deleted from sources DB: ${url}`);
		await addDebugLog({
			message: `Deleted from sources DB: ${url}`,
			level: "info",
			meta: { url },
			type: "source",
		});
		updateStatus(status, true, false);
	}

	/**
	 * Retrieve all articles in the sources DB.
	 *
	 * @returns {Promise<Article[]>} Array of all articles.
	 */
	async function getAllArticles(): Promise<Article[]> {
		return db.query(() => true) ?? [];
	}

	/**
	 * Retrieve a single article by URL.
	 *
	 * @param {string} url - The URL of the article.
	 * @returns {Promise<Article | null>} The article if found, or null.
	 */
	async function getArticle(url: string): Promise<Article | null> {
		return db.get(url) ?? null;
	}

	/**
	 * Query articles using a custom filter function.
	 *
	 * @param {(doc: Article) => boolean} fn - Predicate function to filter articles.
	 * @returns {Promise<Article[]>} Array of articles matching the filter.
	 */
	async function queryArticles(fn: (doc: Article) => boolean): Promise<Article[]> {
		return db.query(fn);
	}

	/**
	 * Add multiple articles, ignoring any that already exist in the DB.
	 *
	 * @param {Article[]} newArticles - Array of articles to add.
	 * @returns {Promise<number>} Number of articles actually added.
	 */
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

	/**
	 * Get the current status of the node.
	 *
	 * @returns {NodeStatus} Current node status object.
	 */
	function getStatus(): NodeStatus {
		return status;
	}

	// --- Return DB + helper functions ---
	return {
		db,
		saveArticle,
		deleteArticle,
		getAllArticles,
		getArticle,
		queryArticles,
		addUniqueArticles,
		getStatus,
	};
}
