// frontend/src/p2p/node.ts
/**
 * Simple Helia + OrbitDB P2P node for storing and syncing news articles.
 * Provides an HTTP API for fetching and saving articles.
 * Ready for peer-to-peer replication in the future.
 */

import { createServer } from "node:http";
import { createOrbitDB, Documents } from "@orbitdb/core";
import { createHelia } from "helia";

import type { LocalArticle } from "../types";

async function startP2PNode() {
	// Start Helia node
	const helia = await createHelia();

	// Initialize OrbitDB
	const orbitdb = await createOrbitDB({ ipfs: helia });

	// Create the Documents database generator and type
	const DocumentsStoreGen = Documents({ indexBy: "url" });

	// Await a concrete database instance
	const newsDB = await DocumentsStoreGen({
		ipfs: helia,
		address: "nous.news.feed",
	});

	// Type of newsDB is automatically inferred:
	// newsDB.put({ [key: string]: string })
	// newsDB.get(key: string) => Promise<{ [key: string]: string } | null>
	// newsDB.query(fn: (doc) => boolean) => Array<{ [key: string]: string }>

	// HTTP API
	const server = createServer(async (req, res) => {
		res.setHeader("Content-Type", "application/json");

		if (req.method === "GET" && req.url === "/articles") {
			const all = newsDB.query?.(() => true) ?? [];
			res.end(JSON.stringify(all));
			return;
		}

		if (req.method === "POST" && req.url === "/save") {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				try {
					const data: Record<string, string> = JSON.parse(body);
					await newsDB.put(data);
					res.end(JSON.stringify({ status: "ok" }));
				} catch (err) {
					res.statusCode = 400;
					res.end(JSON.stringify({ error: (err as Error).message }));
				}
			});
			return;
		}

		res.statusCode = 404;
		res.end(JSON.stringify({ error: "not found" }));
	});

	server.listen(9001, () => {
		console.log("P2P node running on http://127.0.0.1:9001");
	});
}

startP2PNode();
