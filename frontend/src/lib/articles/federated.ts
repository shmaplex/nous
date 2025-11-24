// frontend/src/lib/articles/federated.ts
import { dagCbor } from "@helia/dag-cbor";
import type { Helia } from "helia";
import { CID } from "multiformats/cid";
import type { FederatedArticlePointer } from "@/types";
import { log } from "../utils";

export interface FederatedDB {
	federatedArticlesDB: any; // pass the OrbitDB store here
	helia: Helia; // Helia IPFS instance
}

/**
 * Fetch all federated articles from OrbitDB
 */
export const fetchFederatedArticles = async (
	db: FederatedDB,
): Promise<FederatedArticlePointer[]> => {
	if (!db.federatedArticlesDB) {
		log("⚠️ Federated DB not initialized");
		return [];
	}

	try {
		const all = await db.federatedArticlesDB.query(() => true);
		return all as FederatedArticlePointer[];
	} catch (err) {
		log(`Error fetching federated articles: ${err}`);
		return [];
	}
};

/**
 * Fetch a single federated article by CID
 */
export const fetchFederatedArticleByCID = async (
	db: FederatedDB,
	cid: string,
): Promise<FederatedArticlePointer | null> => {
	const articles = await fetchFederatedArticles(db);
	return articles.find((a) => a.cid === cid) ?? null;
};

/**
 * Fetch full article content via IPFS DAG-CBOR
 */
export const fetchFederatedArticleContent = async (
	db: FederatedDB,
	cid: string | CID, // allow either a string or a CID object
): Promise<any> => {
	if (!db.helia) {
		log("⚠️ Helia IPFS instance not initialized");
		return null;
	}

	try {
		const dag = dagCbor(db.helia);

		// convert string to CID if necessary
		const cidObj: CID = typeof cid === "string" ? CID.parse(cid) : cid;

		const result = await dag.get(cidObj);
		return result;
	} catch (err) {
		log(`Error fetching content for CID ${cid}: ${err}`);
		return null;
	}
};
