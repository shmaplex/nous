// frontend/src/p2p/db-federated.ts
/**
 * @file In-memory DB for Federated Articles
 * @description
 * Holds minimal pointers to articles shared or received via the federation (IPFS/OrbitDB).
 * Provides helper functions for saving, retrieving, and querying federated article pointers.
 */

import { addDebugLog, log } from "@/lib/log.server";
import type { FederatedArticlePointer } from "@/types";

/**
 * Interface for the Federated DB instance
 */
export interface FederatedDB {
	db: FederatedArticlePointer[];
	saveFederatedArticle: (ptr: FederatedArticlePointer) => Promise<void>;
	getFederatedArticles: () => Promise<FederatedArticlePointer[]>;
	queryFederatedArticles: (
		fn: (ptr: FederatedArticlePointer) => boolean,
	) => Promise<FederatedArticlePointer[]>;
}

// Singleton instance
let federatedDBInstance: FederatedDB | null = null;

/**
 * Sets up the federated articles DB.
 * Currently in-memory; safe to call multiple times.
 *
 * @returns Singleton instance with DB + helper functions
 */
export async function setupFederatedDB(): Promise<FederatedDB> {
	if (federatedDBInstance) {
		log("🟢 Federated DB already initialized, skipping setup");
		return federatedDBInstance;
	}

	// Internal in-memory DB
	const db: FederatedArticlePointer[] = [];

	// Optional logging helper
	async function logUpdate(entry: FederatedArticlePointer) {
		const msg = `🔄 Federated pointer updated: ${JSON.stringify(entry)}`;
		log(msg);
		await addDebugLog({ message: msg, level: "info" });

		const countMsg = `📦 Total federated pointers: ${db.length}`;
		log(countMsg);
		await addDebugLog({ message: countMsg, level: "info" });
	}

	/** Save a federated article pointer */
	async function saveFederatedArticle(ptr: FederatedArticlePointer) {
		db.push(ptr);
		await logUpdate(ptr);
	}

	/** Get all federated article pointers */
	async function getFederatedArticles(): Promise<FederatedArticlePointer[]> {
		return db;
	}

	/** Query federated pointers with a custom filter function */
	async function queryFederatedArticles(
		fn: (ptr: FederatedArticlePointer) => boolean,
	): Promise<FederatedArticlePointer[]> {
		return db.filter(fn);
	}

	federatedDBInstance = {
		db,
		saveFederatedArticle,
		getFederatedArticles,
		queryFederatedArticles,
	};

	log("✅ Federated DB setup complete");

	return federatedDBInstance;
}
