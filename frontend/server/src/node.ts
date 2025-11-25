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
import { type AnalyzedDB, setupAnalyzedDB } from "./db-analyzed";
import { type DebugDB, setupDebugDB } from "./db-debug";
import { type FederatedDB, setupFederatedDB } from "./db-federated";
import { type SourceDB, setupSourcesDB } from "./db-sources";
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
	sourcesDB: SourceDB;
	analyzedDB: AnalyzedDB;
	federatedDB: FederatedDB;
} | null = null;

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
	let sourcesDB: SourceDB;
	let analyzedDB: AnalyzedDB;
	let federatedDB: FederatedDB;
	try {
		// --- Setup DBs ---
		debugDB = await setupDebugDB(orbitdb);
		sourcesDB = await setupSourcesDB(orbitdb);
		analyzedDB = await setupAnalyzedDB(orbitdb);
		federatedDB = await setupFederatedDB();

		status.orbitConnected = true;
	} catch (err: any) {
		log(`OrbitDB setup failed: ${err.message}`);
		// Fallback empty DBs if needed
		debugDB = { db: null, add: async () => {}, getAll: async () => [] };
		sourcesDB = {
			db: null,
			saveArticle: async () => {},
			deleteArticle: async () => {},
			getAllArticles: async () => [],
			getArticle: async () => null,
			queryArticles: async () => [],
			addUniqueArticles: async () => 0,
			fetchAllSources: async () => [],
		};
		analyzedDB = {
			db: null,
			saveArticle: async () => {},
			deleteArticle: async () => {},
			getAllArticles: async () => [],
			getArticle: async () => null,
			queryArticles: async () => [],
		};
		federatedDB = {
			db: [],
			saveFederatedArticle: async () => {},
			getFederatedArticles: async () => [],
			queryFederatedArticles: async () => [],
		};
		status.orbitConnected = false;
	}

	runningInstance = { libp2p, helia, orbitdb, status, debugDB, sourcesDB, analyzedDB, federatedDB };

	log("✅ P2P node initialized successfully");

	updateStatus(status);
	return runningInstance;
}
