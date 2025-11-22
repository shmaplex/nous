import { dagCbor } from "@helia/dag-cbor";
import { Documents } from "@orbitdb/core";
import { MemoryDatastore } from "datastore-core/memory";
import { createHelia, type Helia } from "helia";
import { v4 as uuidv4 } from "uuid";
import type { FeedType, LocalArticle, StoredArticle } from "../types";

/**
 * Initialize a Helia IPFS node and an OrbitDB document store for the specified feed.
 *
 * Steps:
 * 1. Create a Helia node with an in-memory datastore (for testing or ephemeral storage).
 * 2. Determine the OrbitDB address based on feed type ("local" or "analyzed").
 * 3. Generate an OrbitDB document store with "url" as the index key.
 * 4. Return both the Helia instance and the OrbitDB store.
 *
 * @param feed - The type of feed, either "local" or "analyzed".
 * @returns An object containing the Helia node and the initialized OrbitDB store.
 */
async function getDB(feed: FeedType) {
	const ipfs = await createHelia({
		datastore: new MemoryDatastore(),
	});

	const address = feed === "local" ? "/orbitdb/local-articles" : "/orbitdb/analyzed-articles";

	const Store = Documents({ indexBy: "url" });
	const store = await Store({ ipfs, address, identity: undefined });

	return { ipfs, store };
}

/**
 * Store an object in IPFS using DAG-CBOR encoding.
 *
 * Steps:
 * 1. Wrap the Helia node with DAG-CBOR.
 * 2. Add the content object to IPFS.
 * 3. Return the CID string representing the stored content.
 *
 * @param ipfs - The Helia IPFS node to use for storing data.
 * @param content - The JavaScript object to store in IPFS.
 * @returns The CID string representing the stored content.
 */
async function storeArticleContent(ipfs: Helia, content: unknown): Promise<string> {
	const dag = dagCbor(ipfs);
	const cid = await dag.add(content);
	return cid.toString();
}

/**
 * Save a LocalArticle to the specified OrbitDB feed and store its content in IPFS.
 *
 * This function handles both "local" and "analyzed" feeds.
 *
 * Steps:
 * 1. Ensure the article has a unique ID (generate one if missing).
 * 2. For the "analyzed" feed, add an analysis timestamp if missing.
 * 3. Store the article content in IPFS DAG-CBOR and save the resulting CID.
 * 4. Map the article to a string-only object suitable for the OrbitDB document store.
 *    - JSON-stringify arrays such as `tags`.
 *    - Convert booleans to string.
 * 5. Save the article to the OrbitDB document store.
 * 6. Log the storage operation for debugging.
 * 7. Stop the Helia node to clean up resources.
 *
 * @param article - The article to save.
 * @param feed - The feed type: "local" or "analyzed" (default: "local").
 */
export async function saveArticle(article: LocalArticle, feed: FeedType = "local") {
	const { ipfs, store } = await getDB(feed);

	// Ensure unique ID
	if (!article.id) article.id = uuidv4();

	// Add analyzed timestamp if applicable
	if (feed === "analyzed" && !article.analysisTimestamp) {
		article.analysisTimestamp = new Date().toISOString();
	}

	// Store content in IPFS DAG-CBOR
	const cid = await storeArticleContent(ipfs, article.content);
	article.ipfsHash = cid;

	// Map article to string-only format for OrbitDB
	const articleToStore: StoredArticle = {
		id: article.id!,
		title: article.title,
		url: article.url,
		content: article.content,
		bias: article.bias ?? "",
		antithesis: article.antithesis ?? "",
		philosophical: article.philosophical ?? "",
		source: article.source ?? "",
		category: article.category ?? "",
		author: article.author ?? "",
		publishedAt: article.publishedAt ?? "",
		tags: JSON.stringify(article.tags || []),
		sentiment: article.sentiment ?? "",
		edition: article.edition ?? "",
		analyzed: String(article.analyzed ?? false),
		ipfsHash: article.ipfsHash ?? "",
		analysisTimestamp: article.analysisTimestamp ?? "",
	};

	// Save to OrbitDB
	await store.put(articleToStore as unknown as { [key: string]: string });

	console.log(`Saved article to ${feed} feed: ${article.title}, CID: ${cid}`);

	// Clean up Helia node
	await ipfs.stop();
}
