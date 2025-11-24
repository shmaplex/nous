// frontend/src/lib/articles/federated.ts
import { dagCbor } from "@helia/dag-cbor";
import type { FederatedArticlePointer, NodeStatus } from "@/types";
import { getDB } from "../../p2p/db"; // helper for OrbitDB + Helia IPFS
import { log } from "../utils";

/**
 * Fetch federated articles from OrbitDB
 */
export const fetchFederatedArticles = async (): Promise<FederatedArticlePointer[]> => {
	// getDB is a helper that returns { store, helia }
	const { store } = await getDB("federated");
	if (!store) {
		log("⚠️ Federated store not initialized");
		return [];
	}

	try {
		const all = await store.query(() => true);
		return all as FederatedArticlePointer[];
	} catch (err) {
		log(`Error fetching federated articles: ${err}`);
		return [];
	}
};

/**
 * Fetch full article content via IPFS DAG-CBOR
 */
export const fetchFederatedArticleContent = async (cid: string, ipfs: any): Promise<any> => {
	try {
		const dag = dagCbor(ipfs);
		const result = await dag.get(cid);
		return result;
	} catch (err) {
		log(`Error fetching content for CID ${cid}: ${err}`);
		return null;
	}
};

/**
 * Helper: fetch a single federated article by CID
 */
export const fetchFederatedArticleByCID = async (
	cid: string,
): Promise<FederatedArticlePointer | null> => {
	const articles = await fetchFederatedArticles();
	return articles.find((a) => a.cid === cid) ?? null;
};
