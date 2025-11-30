import { dagCbor } from "@helia/dag-cbor";
import { Documents } from "@orbitdb/core";
import { MemoryDatastore } from "datastore-core/memory";
import { createHelia, type Helia } from "helia";
import type { Article, FeedType } from "@/types";

/**
 * Initialize a Helia node and OrbitDB document store for a given feed.
 *
 * @param feed - The feed type, either 'local' or 'analyzed'.
 * @returns An object containing the Helia IPFS instance and the OrbitDB document store.
 *
 * Steps:
 * 1. Create a Helia instance with an in-memory datastore.
 * 2. Determine the document store address based on the feed type.
 * 3. Generate an OrbitDB docstore instance indexed by "url".
 * 4. Return the Helia instance and the docstore.
 */
async function getDB(feed: FeedType) {
	const ipfs = await createHelia({
		datastore: new MemoryDatastore(), // in-memory for testing
	});

	const address = feed === "local" ? "/orbitdb/local-articles" : "/orbitdb/analyzed-articles";

	const Store = Documents({ indexBy: "url" });
	const store = await Store({
		ipfs,
		address,
		identity: undefined, // optional; OrbitDB creates default
	});

	return { ipfs, store };
}

/**
 * Store arbitrary content in IPFS using DAG-CBOR encoding and return its CID.
 *
 * @param ipfs - Helia IPFS instance.
 * @param content - The content object to store (can be any JSON-serializable object).
 * @returns The CID string of the stored content in IPFS.
 *
 * Steps:
 * 1. Wrap the Helia node with DAG-CBOR.
 * 2. Add the object to IPFS.
 * 3. Return the CID as a string.
 */
export async function storeArticleContent(ipfs: Helia, content: unknown): Promise<string> {
	const dag = dagCbor(ipfs);
	const cid = await dag.add(content);
	return cid.toString();
}

/**
 * Fetch all articles from a specified feed.
 *
 * @param feed - The feed type to fetch ('local' or 'analyzed'). Defaults to 'local'.
 * @returns An array of Article objects reconstructed from OrbitDB.
 *
 * Steps:
 * 1. Initialize the Helia node and the appropriate OrbitDB docstore.
 * 2. Query all stored documents.
 * 3. Map the stored string-based documents back into Article objects.
 * 4. Stop the Helia node.
 * 5. Return the array of articles.
 */
export async function fetchArticles(feed: FeedType = "local"): Promise<Article[]> {
	const { ipfs, store } = await getDB(feed);

	const raw: Record<string, any>[] = store.query?.(() => true) || [];

	const articles: Article[] = raw.map((a) => ({
		title: a.title,
		url: a.url,
		content: a.content,
		id: a.id,
		bias: a.bias,
		antithesis: a.antithesis,
		philosophical: a.philosophical,
		source: a.source,
		category: a.category,
		author: a.author,
		publishedAt: a.publishedAt,
		tags: a.tags,
		sentiment: a.sentiment,
		edition: a.edition,
		analyzed: a.analyzed,
		ipfsHash: a.ipfsHash, // store DAG-CBOR CID here
		analysisTimestamp: a.analysisTimestamp,
	}));

	await ipfs.stop();
	return articles;
}
