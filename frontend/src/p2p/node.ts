/**
 * @file P2P Node for Nous using Helia + OrbitDB
 * @description
 * Starts a Helia + OrbitDB node for storing, fetching, deleting,
 * and syncing news articles over a P2P federation. Provides a full HTTP API.
 */

import * as fs from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import * as path from "node:path";
import { circuitRelayServer, circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { gossipsub } from "@libp2p/gossipsub";
import { identify, identifyPush } from "@libp2p/identify";
import type { Message, PubSub } from "@libp2p/interface-pubsub";
import { webRTC } from "@libp2p/webrtc";
import { webTransport } from "@libp2p/webtransport";
import { multiaddr } from "@multiformats/multiaddr";
import { createOrbitDB, Identities, type Identity, KeyStore } from "@orbitdb/core";
import { createHelia, type Helia } from "helia";
import { createLibp2p, type Libp2p } from "libp2p";

// ================= Config ================= //
const NODE_ID = process.env.NODE_ID || "nous-node";

const ORBITDB_KEYSTORE_PATH =
	process.env.KEYSTORE_PATH || path.join(process.cwd(), "orbitdb-keystore");
const ORBITDB_DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "orbitdb-databases");

// Ensure directories exist
[ORBITDB_KEYSTORE_PATH, ORBITDB_DB_PATH].forEach((dir) => {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const RELAYS: string[] =
	process.env.RELAYS?.split(",") ||
	[
		// Example relay addresses: "/ip4/1.2.3.4/tcp/15003/p2p/12D3KooWXYZ"
	];

export interface NodeConfig {
	httpPort: number;
	libp2pListenAddr: string;
	relayAddresses?: string[];
}

export interface Article {
	[key: string]: string;
}

export interface ConnectionInfo {
	peerId: string;
	addresses: string[];
	connected: boolean;
}

export interface NodeStatus {
	running: boolean;
	connected: boolean;
	syncing: boolean;
	lastSync: string | null;
	peers?: ConnectionInfo[];
	logs?: string[];
}

// ================= Utilities ================= //

const status: NodeStatus = { running: true, connected: false, syncing: false, lastSync: null };

function log(message: string) {
	console.log(`[P2P NODE] ${new Date().toISOString()} - ${message}`);
}

function updateStatus(connected: boolean, syncing: boolean, push = true) {
	status.connected = connected;
	status.syncing = syncing;

	if (!syncing) status.lastSync = new Date().toISOString();

	if (push) {
		try {
			fs.writeFileSync(
				"/frontend/p2p-status.json",
				JSON.stringify({ ...status, port: process.env.HTTP_PORT }),
			);
		} catch {}
	}
}

async function cleanLockFiles(dir: string) {
	const absoluteDir = path.resolve(dir);
	if (!fs.existsSync(absoluteDir)) return;
	for (const file of fs.readdirSync(absoluteDir)) {
		const filePath = path.join(absoluteDir, file);
		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) await cleanLockFiles(filePath);
		else if (file === "LOCK") {
			try {
				fs.unlinkSync(filePath);
				log(`Removed LOCK: ${filePath}`);
			} catch (err: unknown) {
				log(`Failed to remove LOCK: ${filePath} ${(err as Error).message}`);
			}
		}
	}
}

// ================= P2P Node ================= //

export async function startP2PNode(config: NodeConfig) {
	const { httpPort, libp2pListenAddr, relayAddresses } = config;
	log("Starting P2P node...");

	await cleanLockFiles(ORBITDB_KEYSTORE_PATH);
	await cleanLockFiles(ORBITDB_DB_PATH);

	// --- Libp2p setup ---
	const libp2p: Libp2p = await createLibp2p({
		addresses: { listen: [libp2pListenAddr, "/webrtc", "/webtransport", "/p2p-circuit"] },
		transports: [webRTC(), webTransport(), circuitRelayTransport()],
		services: {
			identify: identify(),
			identifyPush: identifyPush(),
			relay: circuitRelayServer(),
			pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
		},
	});

	libp2p.getMultiaddrs().forEach((addr) => {
		log(`🚦 Listening on: ${addr.toString()}`);
	});

	// Connect to relays
	for (const addr of relayAddresses || []) {
		try {
			await libp2p.dial(multiaddr(addr));
			log(`Connected to relay ${addr}`);
		} catch (err) {
			log(`Failed to connect to relay ${addr}: ${(err as Error).message}`);
		}
	}

	// PubSub message logging
	(libp2p.services.pubsub as PubSub).addEventListener("message", (evt) => {
		log(`PubSub message received: ${JSON.stringify(evt.detail)}`);
	});

	// --- Helia node ---
	const helia: Helia = await createHelia({ libp2p });
	updateStatus(true, false);

	// --- OrbitDB identity ---
	const keystore = await KeyStore({ path: ORBITDB_KEYSTORE_PATH });
	const identities = await Identities({ keystore });
	let identity: Identity;

	try {
		identity =
			(await identities.getIdentity(NODE_ID)) ??
			(await identities.createIdentity({ id: NODE_ID, keystore, type: "ed25519" }));
	} catch {
		identity = await identities.createIdentity({ id: NODE_ID, keystore, type: "ed25519" });
	}

	const orbitdb = await createOrbitDB({ ipfs: helia, identities, identity });

	// --- DB ---
	const newsDB = (await orbitdb.open("nous.news.feed", {
		type: "documents",
		meta: { indexBy: "url" },
	})) as any;

	newsDB.events.on("update", async (entry: any) => {
		log(`🔄 Update from peer: ${JSON.stringify(entry)}`);
		const all = await newsDB.query(() => true);
		log(`📦 Articles in DB: ${all.length}`);
	});

	// --- DB Operations ---
	async function saveArticle(doc: Article) {
		updateStatus(true, true);
		await newsDB.put(doc);
		log(`Saved: ${doc.url}`);
		updateStatus(true, false);
	}
	async function deleteArticle(url: string) {
		updateStatus(true, true);
		await newsDB.del(url);
		log(`Deleted: ${url}`);
		updateStatus(true, false);
	}
	async function getAllArticles(): Promise<Article[]> {
		return newsDB.query(() => true) ?? [];
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

	// ================= Network status ================= //
	async function updateNetworkStatus() {
		try {
			// Revert to 'any' for entry/conns to avoid type errors
			const peers: ConnectionInfo[] = helia.libp2p
				? helia.libp2p.getPeers().map((peerId: any) => {
						const conns: any[] = helia.libp2p.getConnections(peerId); // <- back to 'any'
						return {
							peerId: peerId.toString(),
							connected: conns.length > 0,
							addresses: conns.map((c: any) => c.remoteAddr.toString()),
						};
					})
				: [];
			status.peers = peers;
			updateStatus(peers.length > 0, status.syncing);
		} catch (err) {
			log(`Network status error: ${(err as Error).message}`);
			updateStatus(false, status.syncing);
			status.peers = [];
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
						const peers = libp2p.getPeers().map((peerId) => {
							const conns = libp2p.getConnections(peerId);

							return {
								peerId: peerId.toString(),
								connected: conns.length > 0,
								addresses: conns.map((c) => c.remoteAddr.toString()),
							};
						});

						const full = {
							...status,
							orbitConnected: Boolean(orbitdb),
							syncing: status.syncing,
							peers,
							port: httpPort,
							logs: [],
						};

						return res.end(JSON.stringify(full));
					}
					break;

				case "POST":
					if (req.url === "/save") {
						let body = "";
						req.on("data", (chunk) => {
							body += chunk;
						});
						req.on("end", async () => {
							try {
								await saveArticle(JSON.parse(body));
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
	server.listen(httpPort, () => log(`P2P node HTTP API running on http://127.0.0.1:${httpPort}`));

	// --- Graceful shutdown ---
	let shuttingDown = false;
	async function shutdown() {
		if (shuttingDown) return;
		shuttingDown = true;
		try {
			log("Shutting down HTTP server...");
			await new Promise<void>((resolve, reject) =>
				server.close((err) => (err ? reject(err) : resolve())),
			);
			log("HTTP server closed");
			log("Shutting down OrbitDB and Helia...");
			await newsDB.close();
			await orbitdb.stop();
			await helia.stop();
			log("Cleaning LOCK files...");
			cleanLockFiles(ORBITDB_KEYSTORE_PATH);
			cleanLockFiles(ORBITDB_DB_PATH);
			log("P2P node shutdown complete");
			process.exit(0);
		} catch (err) {
			log(`Shutdown error: ${(err as Error).message}`);
			process.exit(1);
		}
	}

	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
	process.on("uncaughtException", (err) => {
		log(`Uncaught Exception: ${err.message}`);
		shutdown();
	});
	process.on("exit", shutdown);

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
		identity,
	};
}

// ================= Auto-start ================= //

const config: NodeConfig = {
	httpPort: Number(process.env.HTTP_PORT) || 9001, // default port
	libp2pListenAddr: process.env.LIBP2P_ADDR || "/ip4/127.0.0.1/tcp/15003",
	relayAddresses: RELAYS,
};

startP2PNode(config).catch((err) => {
	console.error("Failed to start P2P node:", err);
	process.exit(1);
});
