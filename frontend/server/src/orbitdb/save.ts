import { dagCbor } from "@helia/dag-cbor";
import { Documents } from "@orbitdb/core";
import { MemoryDatastore } from "datastore-core/memory";
import { createHelia, type Helia } from "helia";
import type { ArticleStored, FederatedArticlePointer, FeedType } from "@/types";

/**
 * Initialize a Helia IPFS node and an OrbitDB document store for a given feed.
 *
 * @param feed - Type of feed ("local", "analyzed", "federated", "archived").
 * @returns An object containing:
 *   - `ipfs`: the initialized Helia node
 *   - `store`: the OrbitDB document store instance
 */
async function getDB(feed: FeedType) {
	const ipfs = await createHelia({ datastore: new MemoryDatastore() });

	const addressMap: Record<FeedType, string> = {
		local: "/orbitdb/local-articles",
		analyzed: "/orbitdb/analyzed-articles",
		federated: "/orbitdb/federated-articles",
		archived: "/orbitdb/archived-articles",
	};

	const Store = Documents({ indexBy: "url" });
	const store = await Store({ ipfs, address: addressMap[feed], identity: undefined });

	return { ipfs, store };
}

/**
 * Store a JavaScript object in IPFS using DAG-CBOR encoding.
 *
 * @param ipfs - Helia node instance
 * @param content - Object to store
 * @returns CID string representing the content in IPFS
 */
async function storeArticleContent(ipfs: Helia, content: unknown): Promise<string> {
	const dag = dagCbor(ipfs);
	const cid = await dag.add(content);
	return cid.toString();
}

/**
 * Save an `ArticleStored` to the specified feed.
 *
 * This function:
 * - Generates a UUID if missing
 * - Adds `analysisTimestamp` if article is analyzed
 * - Stores the full content in IPFS DAG-CBOR
 * - Saves the article to OrbitDB
 * - Optionally generates a federated pointer for distribution
 *
 * @param article - The article to save (raw or analyzed)
 * @param feed - Feed type; defaults to "local"
 */
export async function saveArticle(article: ArticleStored, feed: FeedType = "local") {
	const { ipfs, store } = await getDB(feed);

	// Ensure UUID
	if (!article.id) article.id = crypto.randomUUID();

	// Store full content in IPFS
	const cid = await storeArticleContent(ipfs, article);

	// Narrow union safely
	if (article.analyzed) {
		// ArticleAnalyzed
		article.ipfsHash = cid;
		article.analysisTimestamp ??= new Date().toISOString();
		article.source ??= article.source ?? "";
		article.edition ??= article.edition ?? "other";
	} else {
		// ArticleSchema (raw)
		article.ipfsHash = cid;
		// Map raw article fields to federated-compatible fields
		(article as ArticleStored & { source: string }).source = article.sourceDomain ?? "";
		(article as ArticleStored & { edition: string }).edition = "other";
	}

	// Save to OrbitDB
	await store.put(article as any);

	// Federated pointer (use it or remove)
	// const pointer: FederatedArticlePointer = {
	// 	cid,
	// 	timestamp: new Date().toISOString(),
	// 	analyzed: article.analyzed,
	// 	source: (article as any).source, // now safe
	// 	edition: (article as any).edition,
	// };
	// TODO: Save to federated store
	// await federatedStore.put(pointer as any);

	console.log(`Saved article "${article.title}" to feed ${feed}, CID: ${cid}`);

	await ipfs.stop();
}
