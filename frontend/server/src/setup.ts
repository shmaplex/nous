import fs from "node:fs";
import path from "node:path";
import { log } from "@/lib/log.server";
import { loadStatus, updateStatus } from "@/lib/status.server";
import type { NodeConfig } from "@/types";
import type { ArticleAnalyzedDB } from "./db-articles-analyzed";
import type { ArticleFederatedDB } from "./db-articles-federated";
import type { ArticleLocalDB } from "./db-articles-local";
import type { DebugDB } from "./db-debug";
import { createHttpServer, type HttpServerContext } from "./httpServer";
import { startNetworkStatusPoll } from "./networkStatus";
import { getP2PNode, type NodeInstance, setRunningInstance } from "./node";
import { registerShutdownHandlers } from "./shutdown";

const DB_PATH_FILE = "path.json";
const IDENTITY_ID = process.env.IDENTITY_ID ?? "nous-node";

// Critical: Storage and Database Paths
const ORBITDB_KEYSTORE_PATH =
	process.env.ORBITDB_KEYSTORE_PATH || path.join(process.cwd(), "frontend/.nous/orbitdb-keystore");
const ORBITDB_DB_PATH =
	process.env.ORBITDB_DB_PATH || path.join(process.cwd(), "frontend/.nous/orbitdb-databases");
const BLOCKSTORE_PATH =
	process.env.BLOCKSTORE_PATH || path.join(process.cwd(), "frontend/.nous/helia-blockstore");

// Ensure directories exist
[ORBITDB_KEYSTORE_PATH, ORBITDB_DB_PATH].forEach((dir) => {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const RELAYS: string[] = process.env.RELAYS?.split(",") || [];

export type P2PDatabases = {
	debugDB: DebugDB;
	articleLocalDB: ArticleLocalDB;
	articleAnalyzedDB: ArticleAnalyzedDB;
	articleFederatedDB: ArticleFederatedDB;
};

export interface DBPaths {
	articles?: string; // OrbitDB address
	analyzed?: string;
	debug?: string;
	federated?: string;
}

/** Load saved DB paths */
export function loadDBPaths(): DBPaths | null {
	try {
		if (fs.existsSync(ORBITDB_DB_PATH)) {
			return JSON.parse(
				fs.readFileSync(path.join(ORBITDB_DB_PATH, DB_PATH_FILE), "utf8"),
			) as DBPaths;
		}
	} catch (err) {
		console.error("Failed to load DB paths file:", err);
	}
	return null;
}

/** Save DB paths */
export function saveDBPaths(paths: DBPaths) {
	try {
		fs.writeFileSync(
			path.join(ORBITDB_DB_PATH, DB_PATH_FILE),
			JSON.stringify(paths, null, 2),
			"utf8",
		);
	} catch (err) {
		console.error("Failed to save DB paths file:", err);
	}
}

export async function startP2PNode(config: NodeConfig): Promise<NodeInstance> {
	log("Setting up node...");

	const status = loadStatus();

	// Get or create running instance
	const {
		// Databases
		debugDB,
		articleLocalDB,
		articleAnalyzedDB,
		articleFederatedDB,
		identity,
		identities,

		// Core node
		keystore,
		libp2p,
		helia,
		orbitdb,
		status: nodeStatus,

		// Paths
		orbitDBKeystorePath,
		orbitDBPath,
		blockstorePath,
	} = await getP2PNode(config);

	// --- Start network polling ---
	const stopNetworkPoll = startNetworkStatusPoll(helia, nodeStatus);

	const httpPort = config?.httpPort || 9001;

	// --- HTTP server ---
	const httpContext: HttpServerContext = {
		status: nodeStatus,
		orbitdbConnected: Boolean(orbitdb),
		httpPort,

		// Pass custom database methods
		...debugDB,
		...articleLocalDB,
		...articleAnalyzedDB,
		...articleFederatedDB,
	};

	const { server, shutdown: shutdownHttpServer } = createHttpServer(httpPort, httpContext);

	status.running = true;

	// --- Graceful shutdown ---
	const runningInstance = {
		// Databases
		debugDB,
		articleLocalDB,
		articleAnalyzedDB,
		articleFederatedDB,
		// Core node
		helia,
		orbitdb,
		keystore,
		identity,
		identities,
		// HTTP server
		httpServer: server,
		shutdownHttpServer,
		stopNetworkPoll,
		libp2p,
		status: nodeStatus,

		orbitDBKeystorePath,
		orbitDBPath,
		blockstorePath,
	} as NodeInstance;

	setRunningInstance(runningInstance);

	updateStatus(status);

	console.log("Current status:", status);

	// Register process signals once
	registerShutdownHandlers();

	return runningInstance;
}

// Auto-start
const config: NodeConfig = {
	httpPort: Number(process.env.HTTP_PORT) || 9001,
	libp2pListenAddr: process.env.LIBP2P_ADDR || "/ip4/127.0.0.1/tcp/15003",
	relayAddresses: RELAYS || [],
	identityId: IDENTITY_ID,
	orbitDBKeystorePath: ORBITDB_KEYSTORE_PATH,
	orbitDBPath: ORBITDB_DB_PATH,
	blockstorePath: BLOCKSTORE_PATH,
};

startP2PNode(config).catch((err) => {
	console.error("Failed to start P2P node:", err);
	process.exit(1);
});
