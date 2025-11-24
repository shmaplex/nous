// frontend/src/p2p/db-federated.ts
/**
 * @file OrbitDB setup and DB operations for Nous P2P Node (Federated DB)
 * @description
 * Holds minimal pointers to articles shared or received via the federation (IPFS/OrbitDB).
 * Provides helper functions for saving, retrieving, and querying federated article pointers.
 */

import { addDebugLog, log } from "@/lib/log";

import type { FederatedArticlePointer } from "@/types";

// --- In-memory placeholder for federated pointers ---
const federatedDB: FederatedArticlePointer[] = [];

/**
 * Sets up a federated articles DB
 * Currently in-memory; can later use OrbitDB/IPFS
 *
 * @returns Helper functions and DB instance
 */
export async function setupFederatedDB() {
	// --- Optional logging ---
	async function logUpdate(entry: FederatedArticlePointer) {
		log(`🔄 Federated pointer updated: ${JSON.stringify(entry)}`);
		log(`📦 Total federated pointers: ${federatedDB.length}`);
		await addDebugLog({
			message: `🔄 Federated pointer updated: ${JSON.stringify(entry)}`,
			level: "info",
			meta: { pointer: JSON.stringify(entry) },
			type: "federated",
		});
		await addDebugLog({
			message: `📦 Total federated pointers: ${federatedDB.length}`,
			level: "info",
			meta: { length: federatedDB.length },
			type: "federated",
		});
	}

	// --- DB Operations ---

	/**
	 * Save a federated article pointer
	 *
	 * @param {FederatedArticlePointer} ptr - Federated pointer to save
	 */
	async function saveFederatedArticle(ptr: FederatedArticlePointer) {
		federatedDB.push(ptr);
		await logUpdate(ptr);
	}

	/**
	 * Get all federated article pointers
	 *
	 * @returns {Promise<FederatedArticlePointer[]>} Array of federated pointers
	 */
	async function getFederatedArticles(): Promise<FederatedArticlePointer[]> {
		return federatedDB;
	}

	/**
	 * Query federated pointers with a custom filter function
	 *
	 * @param {(ptr: FederatedArticlePointer) => boolean} fn - Filter function
	 * @returns {Promise<FederatedArticlePointer[]>} Array of matching pointers
	 */
	async function queryFederatedArticles(
		fn: (ptr: FederatedArticlePointer) => boolean,
	): Promise<FederatedArticlePointer[]> {
		return federatedDB.filter(fn);
	}

	return {
		federatedDB,
		saveFederatedArticle,
		getFederatedArticles,
		queryFederatedArticles,
	};
}
