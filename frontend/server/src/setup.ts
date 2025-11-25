import fs from "node:fs";
import path from "node:path";
import { log } from "@/lib/log.server";
import { loadStatus, updateStatus } from "@/lib/status.server";
import type { NodeConfig } from "@/types";
import type { AnalyzedDB } from "./db-analyzed";
import type { DebugDB } from "./db-debug";
import type { FederatedDB } from "./db-federated";
import type { SourceDB } from "./db-sources";
import { createHttpServer, type HttpServerContext } from "./httpServer";
import { startNetworkStatusPoll } from "./networkStatus";
import { getP2PNode } from "./node";
import { registerShutdownHandlers, setRunningInstance, shutdownP2PNode } from "./shutdown";

const ORBITDB_KEYSTORE_PATH =
	process.env.KEYSTORE_PATH || path.join(process.cwd(), "orbitdb-keystore");
const ORBITDB_DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "orbitdb-databases");

// Ensure directories exist
[ORBITDB_KEYSTORE_PATH, ORBITDB_DB_PATH].forEach((dir) => {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const RELAYS: string[] = process.env.RELAYS?.split(",") || [];

export type P2PDatabases = {
	debugDB: DebugDB;
	sourcesDB: SourceDB;
	analyzedDB: AnalyzedDB;
	federatedDB: FederatedDB;
};

export async function startP2PNode(config: NodeConfig) {
	log("Setting up node...");

	// Get or create running instance
	const {
		libp2p,
		helia,
		orbitdb,
		status: nodeStatus,
		debugDB,
		sourcesDB,
		analyzedDB,
		federatedDB,
	} = await getP2PNode(config);

	// --- Start network polling ---
	const stopNetworkPoll = startNetworkStatusPoll(helia, nodeStatus);

	// --- HTTP server ---
	const httpContext: HttpServerContext = {
		status: nodeStatus,
		orbitdbConnected: Boolean(orbitdb),
		httpPort: config.httpPort,
		...sourcesDB,
		...analyzedDB,
		...federatedDB,
	};

	const server = createHttpServer(config.httpPort, httpContext);

	// --- Graceful shutdown ---
	const runningInstance = { libp2p, helia, orbitdb, debugDB, sourcesDB, analyzedDB, federatedDB };
	setRunningInstance(runningInstance);

	const status = loadStatus();
	console.log("Current status:", status);

	updateStatus({
		running: true,
	});

	// Register process signals once
	registerShutdownHandlers();

	return {
		// DBs
		debugDB,
		sourcesDB,
		analyzedDB,
		federatedDB,
		// Core node
		helia,
		orbitdb,
		server,
		libp2p,
		nodeStatus,
		stopNetworkPoll,
		shutdown: shutdownP2PNode,
	};
}

// Auto-start
const config: NodeConfig = {
	httpPort: Number(process.env.HTTP_PORT) || 9001,
	libp2pListenAddr: process.env.LIBP2P_ADDR || "/ip4/127.0.0.1/tcp/15003",
	relayAddresses: RELAYS,
};

startP2PNode(config).catch((err) => {
	console.error("Failed to start P2P node:", err);
	process.exit(1);
});
