// frontend/src/p2p/node.ts
import fs from "node:fs";
import path from "node:path";
import { createOrbitDB, type OrbitDB } from "@orbitdb/core";
import type { Helia } from "helia";
import { createHelia } from "helia";
import type { Libp2p } from "libp2p";
import { log } from "@/lib/log.server";
import { updateStatus } from "@/lib/status.server";
import { cleanLockFiles } from "@/lib/utils.server";
import { createEmptyNodeStatus, type NodeConfig, type NodeStatus } from "@/types";
import { type ArticleAnalyzedDB, setupArticleAnalyzedDB } from "./db-articles-analyzed";
import { type ArticleFederatedDB, setupArticleFederatedDB } from "./db-articles-federated";
import { type ArticleLocalDB, setupArticleLocalDB } from "./db-articles-local";
import { type DebugDB, setupDebugDB } from "./db-debug";
import { getOrbitDBIdentity } from "./identity";
import { createLibp2pNode } from "./libp2pNode";

const ORBITDB_KEYSTORE_PATH =
	process.env.KEYSTORE_PATH || path.join(process.cwd(), "orbitdb-keystore");
const ORBITDB_DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "orbitdb-databases");

let runningInstance: {
	libp2p: Libp2p;
	helia: Helia;
	orbitdb: OrbitDB;
	status: NodeStatus;
	debugDB: DebugDB;
	articleLocalDB: ArticleLocalDB;
	articleAnalyzedDB: ArticleAnalyzedDB;
	articleFederatedDB: ArticleFederatedDB;
} | null = null;

/**
 * Generic fallback creator for any DB interface.
 * Functions get async stubs, other properties get default values.
 */
function createFallbackDB<T extends Record<string, any>>(defaults?: Partial<T>): T {
	const fallback: Record<string, any> = {};

	for (const key in defaults) {
		const value = defaults[key];
		if (typeof value === "function") {
			fallback[key] = async (..._args: any[]) => value(..._args);
		} else {
			fallback[key] = value;
		}
	}

	return new Proxy(fallback, {
		get(target, prop: string) {
			if (!(prop in target)) {
				// Auto-generate sensible defaults
				return async (..._args: any[]) => {
					// If prop name suggests array return
					if (/^(get|fetch|query)/.test(prop)) return [];
					// If prop name suggests void operation
					if (/^(save|add|delete)/.test(prop)) return undefined;
					return undefined;
				};
			}
			return target[prop];
		},
	}) as T;
}

/**
 * Start or return the running P2P node instances
 */
export async function getP2PNode(config?: NodeConfig) {
	if (runningInstance) {
		log("🟢 P2P node already running, returning existing instance");
		return runningInstance;
	}

	const nodeConfig: NodeConfig = config || {
		httpPort: Number(process.env.HTTP_PORT) || 9001,
		libp2pListenAddr: process.env.LIBP2P_ADDR || "/ip4/127.0.0.1/tcp/15003",
		relayAddresses: process.env.RELAYS?.split(",") || [],
	};

	// Ensure directories exist
	[ORBITDB_KEYSTORE_PATH, ORBITDB_DB_PATH].forEach((dir) => {
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	});

	const status: NodeStatus = createEmptyNodeStatus();

	log("Starting P2P node...");

	// --- Clean leftover locks ---
	await cleanLockFiles(ORBITDB_KEYSTORE_PATH);
	await cleanLockFiles(ORBITDB_DB_PATH);

	// --- Libp2p ---
	const libp2p = await createLibp2pNode(nodeConfig.libp2pListenAddr, nodeConfig.relayAddresses);

	// Libp2p Connected Status
	status.connected = true;

	// --- Helia ---
	const helia = await createHelia({ libp2p });

	// --- OrbitDB ---
	const { identity, identities } = await getOrbitDBIdentity();
	const orbitdb = await createOrbitDB({
		ipfs: helia,
		identity,
		identities,
		directory: ORBITDB_DB_PATH,
	});

	let debugDB: DebugDB;
	let articleLocalDB: ArticleLocalDB;
	let articleAnalyzedDB: ArticleAnalyzedDB;
	let articleFederatedDB: ArticleFederatedDB;
	try {
		// --- Setup DBs ---
		debugDB = await setupDebugDB(orbitdb);
		articleLocalDB = await setupArticleLocalDB(orbitdb);
		articleAnalyzedDB = await setupArticleAnalyzedDB(orbitdb);
		articleFederatedDB = await setupArticleFederatedDB();

		status.orbitConnected = true;
	} catch (err: any) {
		log(`Critical error initializing OrbitDB databases: ${err.message}`, "error");

		status.orbitConnected = false;
		throw new Error("Failed to initialize databases. Node cannot start.");
	}

	runningInstance = {
		libp2p,
		helia,
		orbitdb,
		status,
		debugDB,
		articleLocalDB,
		articleAnalyzedDB,
		articleFederatedDB,
	};

	log("✅ P2P node initialized successfully");

	updateStatus(status);
	return runningInstance;
}
