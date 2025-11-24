import type { OrbitDB } from "@orbitdb/core";
import { log, updateStatus } from "../lib/utils";
import type { ArticleAnalyzed, ArticleStored, FederatedArticlePointer, NodeStatus } from "../types";

export interface DBs {
	localArticlesDB: any;
	analyzedArticlesDB: any;
	federatedArticlesDB?: any;
}

export async function initDBs(
	orbitdb: OrbitDB,
	status: NodeStatus,
	options?: { includeFederated?: boolean },
) {
	// --- Local Articles DB ---
	const localArticlesDB = (await orbitdb.open("local-articles", {
		type: "documents",
		meta: { indexBy: "url" },
	})) as any;
	localArticlesDB.events.on("update", async (entry: any) => {
		log(`📝 Local article updated: ${JSON.stringify(entry)}`);
		const all = await localArticlesDB.query(() => true);
		log(`📦 Local articles count: ${all.length}`);
	});

	// --- Analyzed Articles DB ---
	const analyzedArticlesDB = (await orbitdb.open("analyzed-articles", {
		type: "documents",
		meta: { indexBy: "url" },
	})) as any;
	analyzedArticlesDB.events.on("update", async (entry: any) => {
		log(`🧠 Analyzed article updated: ${JSON.stringify(entry)}`);
		const all = await analyzedArticlesDB.query(() => true);
		log(`📦 Analyzed articles count: ${all.length}`);
	});

	// --- Optional Federated Articles DB ---
	let federatedArticlesDB: any;
	if (options?.includeFederated) {
		federatedArticlesDB = await orbitdb.open("federated-articles", {
			type: "documents",
			meta: { indexBy: "cid" },
		});
		federatedArticlesDB.events.on("update", async (entry: any) => {
			log(`🌐 Federated article updated: ${JSON.stringify(entry)}`);
			const all = await federatedArticlesDB.query(() => true);
			log(`📦 Federated articles count: ${all.length}`);
		});
	}

	// --- Save helpers ---
	async function saveLocalArticle(doc: ArticleStored) {
		updateStatus(status, true, true);
		await localArticlesDB.put(doc);
		log(`Saved local article: ${doc.url}`);
		updateStatus(status, true, false);
	}

	async function saveAnalyzedArticle(doc: ArticleAnalyzed) {
		updateStatus(status, true, true);
		const storedDoc = { ...doc, tags: doc.tags?.join(",") ?? "" };
		await analyzedArticlesDB.put(storedDoc);
		log(`Saved analyzed article: ${doc.url}`);
		updateStatus(status, true, false);
	}

	async function saveFederatedArticle(doc: FederatedArticlePointer) {
		if (!federatedArticlesDB) throw new Error("Federated DB not initialized");
		updateStatus(status, true, true);
		await federatedArticlesDB.put(doc);
		log(`Saved federated article: ${doc.cid}`);
		updateStatus(status, true, false);
	}

	// --- Get helpers ---
	async function getAllLocalArticles(): Promise<ArticleStored[]> {
		return localArticlesDB.query(() => true) ?? [];
	}

	async function getAllAnalyzedArticles(): Promise<ArticleAnalyzed[]> {
		const docs = analyzedArticlesDB.query(() => true) ?? [];
		return docs.map((doc: ArticleAnalyzed & { tags: string }) => ({
			...doc,
			tags: typeof doc.tags === "string" ? doc.tags.split(",") : doc.tags,
		}));
	}

	async function getAllFederatedArticles(): Promise<FederatedArticlePointer[]> {
		if (!federatedArticlesDB) return [];
		return federatedArticlesDB.query(() => true) ?? [];
	}

	return {
		localArticlesDB,
		analyzedArticlesDB,
		federatedArticlesDB,
		saveLocalArticle,
		saveAnalyzedArticle,
		saveFederatedArticle: options?.includeFederated ? saveFederatedArticle : undefined,
		getAllLocalArticles,
		getAllAnalyzedArticles,
		getAllFederatedArticles: options?.includeFederated ? getAllFederatedArticles : undefined,
	};
}
