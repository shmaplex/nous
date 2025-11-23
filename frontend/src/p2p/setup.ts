import * as fs from "node:fs";
import * as path from "node:path";
import { createOrbitDB } from "@orbitdb/core";
// import { FsBlockstore } from "blockstore-fs";
import type { Helia } from "helia";
import { createHelia } from "helia";
import type { Libp2p } from "libp2p";
import type { Article, NodeConfig, NodeStatus } from "../types";
import { initDBs as setupLocalAnalyzedDBs } from "./db";
import { setupDB as setupNewsDB } from "./db-news";
import { createHttpServer } from "./httpServer";
import { getOrbitDBIdentity } from "./identity";
import { createLibp2pNode } from "./libp2pNode";
import { startNetworkStatusPoll } from "./networkStatus";
import { setupGracefulShutdown } from "./shutdown";
import { cleanLockFiles, log, updateStatus } from "./utils";

// ================= Config ================= //
const ORBITDB_KEYSTORE_PATH =
	process.env.KEYSTORE_PATH || path.join(process.cwd(), "orbitdb-keystore");
const ORBITDB_DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "orbitdb-databases");

[ORBITDB_KEYSTORE_PATH, ORBITDB_DB_PATH].forEach((dir) => {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const RELAYS: string[] = process.env.RELAYS?.split(",") || [];

// ================= Utilities ================= //
const status: NodeStatus = { running: true, connected: false, syncing: false, lastSync: null };

// ================= P2P Node ================= //
export async function startP2PNode(config: NodeConfig) {
	const { httpPort, libp2pListenAddr, relayAddresses } = config;
	log("Starting P2P node...");

	// --- Clean leftover locks ---
	await cleanLockFiles(ORBITDB_KEYSTORE_PATH);
	await cleanLockFiles(ORBITDB_DB_PATH);

	// --- Libp2p ---
	const libp2p: Libp2p = await createLibp2pNode(libp2pListenAddr, relayAddresses);

	// --- Helia ---
	// const blockstorePath = path.join(process.cwd(), "helia-repo");
	const helia: Helia = await createHelia({
		libp2p,
		// blockstore: new FsBlockstore(blockstorePath),
	});
	updateStatus(status, true, false);

	// --- OrbitDB Identity + instance ---
	const { identity, identities } = await getOrbitDBIdentity();
	const orbitdb = await createOrbitDB({
		ipfs: helia,
		identity,
		identities,
		directory: ORBITDB_DB_PATH,
	});

	// --- OrbitDB News DB ---
	const {
		newsDB,
		saveArticle,
		deleteArticle,
		getAllArticles,
		getArticle,
		queryArticles,
		getStatus,
	} = await setupNewsDB(orbitdb, status);

	// --- OrbitDB Local + Analyzed DBs ---
	const {
		localArticlesDB,
		analyzedArticlesDB,
		saveLocalArticle,
		saveAnalyzedArticle,
		getAllLocalArticles,
		getAllAnalyzedArticles,
	} = await setupLocalAnalyzedDBs(orbitdb);

	// --- Start network polling ---
	const stopNetworkPoll = startNetworkStatusPoll(helia, status);

	// --- HTTP server ---
	const server = createHttpServer(
		httpPort,
		status,
		getAllArticles,
		saveArticle,
		deleteArticle,
		Boolean(orbitdb),
	);

	// --- Graceful shutdown ---
	const shutdown = setupGracefulShutdown(
		server,
		newsDB,
		orbitdb,
		helia,
		ORBITDB_KEYSTORE_PATH,
		ORBITDB_DB_PATH,
	);

	return {
		// News DB
		saveArticle,
		deleteArticle,
		getAllArticles,
		getArticle,
		queryArticles,
		// Local/Analyzed DBs
		localArticlesDB,
		analyzedArticlesDB,
		saveLocalArticle,
		saveAnalyzedArticle,
		getAllLocalArticles,
		getAllAnalyzedArticles,
		// Core node
		getStatus,
		newsDB,
		helia,
		orbitdb,
		server,
		libp2p,
		identity,
		stopNetworkPoll,
		shutdown,
	};
}

// ================= Auto-start ================= //
const config: NodeConfig = {
	httpPort: Number(process.env.HTTP_PORT) || 9001,
	libp2pListenAddr: process.env.LIBP2P_ADDR || "/ip4/127.0.0.1/tcp/15003",
	relayAddresses: RELAYS,
};

startP2PNode(config).catch((err) => {
	console.error("Failed to start P2P node:", err);
	process.exit(1);
});
