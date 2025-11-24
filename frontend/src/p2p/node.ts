// frontend/src/p2p/node.ts
import fs from "node:fs";
import path from "node:path";
import { createOrbitDB, type OrbitDB } from "@orbitdb/core";
import type { Helia } from "helia";
import { createHelia } from "helia";
import type { Libp2p } from "libp2p";
import { log } from "@/lib/log";
import { cleanLockFiles } from "../lib/utils";
import { createEmptyNodeStatus, type NodeConfig, type NodeStatus } from "../types";
import { setupAnalyzedDB } from "./db-analyzed";
import { setupDebugDB } from "./db-debug";
import { setupFederatedDB } from "./db-federated";
import { setupSourcesDB } from "./db-sources";
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
	debugDB: any;
	sourcesDB: any;
	analyzedDB: any;
	federatedDB: any;
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

	// --- Setup DBs ---
	const debugDB = await setupDebugDB(orbitdb, status);
	const sourcesDB = await setupSourcesDB(orbitdb, status);
	const analyzedDB = await setupAnalyzedDB(orbitdb, status);
	const federatedDB = await setupFederatedDB(status);

	runningInstance = { libp2p, helia, orbitdb, status, debugDB, sourcesDB, analyzedDB, federatedDB };

	log("✅ P2P node initialized successfully");

	return runningInstance;
}

/**
 * Stop the running instance (optional)
 */
export async function stopP2PNode() {
	if (!runningInstance) return;
	const { libp2p } = runningInstance;
	log("Shutting down P2P node...");
	await libp2p.stop();
	runningInstance = null;
}
