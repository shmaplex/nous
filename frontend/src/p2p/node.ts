/**
 * @file P2P Node for Nous using Helia + OrbitDB
 * @description
 * This module starts a Helia + OrbitDB node for storing, fetching, deleting,
 * and syncing news articles over a P2P federation. Provides a simple HTTP API.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { identify } from "@libp2p/identify";
import { createOrbitDB, Documents, Identities, type Identity, KeyStore } from "@orbitdb/core";
import { createHelia, type Helia } from "helia";
import { createLibp2p } from "libp2p";

/**
 * Represents the connection and sync status of the P2P node.
 */
export interface NodeStatus {
	connected: boolean;
	syncing: boolean;
	lastSync: string | null;
}

/**
 * Represents a news article stored in OrbitDB.
 */
export interface Article {
	[key: string]: string;
}

/** Current node status */
const status: NodeStatus = {
	connected: false,
	syncing: false,
	lastSync: null,
};

/**
 * Logs messages to the console with a timestamp prefix.
 * @param message - The message to log
 */
function log(message: string) {
	console.log(`[P2P NODE] ${new Date().toISOString()} - ${message}`);
}

/**
 * Updates the node's status.
 * @param connected - Whether the node is connected to peers
 * @param syncing - Whether the node is currently syncing data
 */
function updateStatus(connected: boolean, syncing: boolean) {
	status.connected = connected;
	status.syncing = syncing;
	if (!syncing) status.lastSync = new Date().toISOString();
}

/**
 * Starts the Helia + OrbitDB P2P node.
 * @returns An object exposing DB operations, node status, and server instance
 */
export async function startP2PNode() {
	log("Starting libp2p + Helia node...");

	// --- libp2p node for federation ---
	const libp2p = await createLibp2p({
		services: {
			pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }) as any,
			identify: identify(),
		},
	});

	// --- Helia node using libp2p ---
	const helia: Helia = await createHelia({ libp2p });
	updateStatus(true, false);

	// --- Persistent identity setup ---
	log("Initializing keystore and OrbitDB identity...");

	// Local keystore persists the user's root key
	const keystore = await KeyStore({ path: "./orbitdb-keystore" });

	// Initialize identities manager using the persistent keystore
	const identities = await Identities({ keystore });

	console.log("✅ Keystore and identities initialized", identities);
	// Attempt to load existing identity by id
	// Ensure identity is always defined
	// Ensure a valid OrbitDB identity
	let identity: Identity;

	try {
		identity = await identities.getIdentity("nous-node");
		console.log("Identity:", identity, identity?.id);
		if (!identity?.id) {
			throw new Error("OrbitDB identity missing before createOrbitDB");
		}

		if (!identity) {
			identity = await identities.createIdentity({
				id: "nous-node",
				keystore, // explicitly provide keystore
				type: "ed25519", // common type
			});
			log("Created new OrbitDB identity");
		} else {
			log("Loaded existing identity");
		}
	} catch (err: unknown) {
		log("Identity load/create failed, creating new one with fallback");
		identity = await identities.createIdentity({
			id: "nous-node",
			keystore,
			type: "ed25519",
		});
	}

	// Use this identity for OrbitDB
	const orbitdb = await createOrbitDB({ ipfs: helia, identity });

	// --- Create typed Documents database for articles ---
	const DocumentsStore = Documents({ indexBy: "url" });
	const newsDB = await DocumentsStore({
		ipfs: helia,
		address: "nous.news.feed",
	});

	log("OrbitDB ready. Connecting to federation...");

	// --- Listen for updates from peers ---
	newsDB.events.on("update", async (entry: any) => {
		log(`🔄 Update received from peer: ${JSON.stringify(entry)}`);
		const all = await newsDB.query(() => true);
		log(`📦 Current articles in DB: ${all.length}`);
	});

	// --- DB operations ---
	async function saveArticle(doc: Article) {
		updateStatus(true, true);
		await newsDB.put(doc);
		log(`Saved article: ${doc.url ?? "unknown URL"}`);
		updateStatus(true, false);
	}

	async function deleteArticle(url: string) {
		updateStatus(true, true);
		await newsDB.del(url);
		log(`Deleted article: ${url}`);
		updateStatus(true, false);
	}

	async function getAllArticles(): Promise<Article[]> {
		return newsDB.query?.(() => true) ?? [];
	}

	async function getArticle(url: string): Promise<Article | null> {
		return newsDB.get(url) ?? null;
	}

	async function queryArticles(fn: (doc: Article) => boolean): Promise<Article[]> {
		return newsDB.query(fn);
	}

	function getStatus(): NodeStatus {
		return status;
	}

	// --- Periodically update network connection status ---
	async function updateNetworkStatus() {
		try {
			let connected = false;
			if (helia.libp2p) {
				const peers = helia.libp2p.getPeers ? helia.libp2p.getPeers() : [];
				connected = peers.length > 0;
			}
			updateStatus(connected, status.syncing);
		} catch (err) {
			log(`Error updating network status: ${(err as Error).message}`);
			updateStatus(false, status.syncing);
		}
	}
	setInterval(updateNetworkStatus, 5000);

	// --- HTTP API ---
	const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
		res.setHeader("Content-Type", "application/json");

		try {
			switch (req.method) {
				case "GET":
					if (req.url === "/articles") {
						res.end(JSON.stringify(await getAllArticles()));
						return;
					}
					if (req.url === "/status") {
						res.end(JSON.stringify(getStatus()));
						return;
					}
					break;

				case "POST":
					if (req.url === "/save") {
						let body = "";
						req.on("data", (chunk: string) => {
							body += chunk;
						});
						req.on("end", async () => {
							try {
								const data: Article = JSON.parse(body);
								await saveArticle(data);
								res.end(JSON.stringify({ status: "ok" }));
							} catch (err) {
								res.statusCode = 400;
								res.end(JSON.stringify({ error: (err as Error).message }));
							}
						});
						return;
					}
					if (req.url?.startsWith("/delete/")) {
						const url = req.url.replace("/delete/", "");
						await deleteArticle(url);
						res.end(JSON.stringify({ status: "deleted" }));
						return;
					}
					break;
			}

			res.statusCode = 404;
			res.end(JSON.stringify({ error: "not found" }));
		} catch (err) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: (err as Error).message }));
		}
	});

	server.listen(9001, () => {
		log("P2P node running on http://127.0.0.1:9001");
		console.log("READY");
	});

	return {
		saveArticle,
		deleteArticle,
		getAllArticles,
		getArticle,
		queryArticles,
		getStatus,
		newsDB,
		helia,
		orbitdb,
		server,
		libp2p,
		identity, // expose identity for debugging if needed
	};
}

// Auto-start
startP2PNode().catch((err) => {
	console.error("Failed to start P2P node:", err);
});
