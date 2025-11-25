import type { OrbitDB } from "@orbitdb/core";
import type { Helia } from "helia";
import { log } from "@/lib/log.server";
import { deleteStatus } from "@/lib/status.server";
import { cleanLockFiles } from "@/lib/utils.server";
import type { P2PDatabases } from "./setup";

/**
 * Singleton reference to the running P2P node instance.
 * Stores libp2p, helia, OrbitDB, and all database instances.
 */
let runningInstance: {
	libp2p: any;
	helia: Helia;
	orbitdb: OrbitDB;
	debugDB?: P2PDatabases["debugDB"];
	articleLocalDB?: P2PDatabases["articleLocalDB"];
	articleAnalyzedDB?: P2PDatabases["articleAnalyzedDB"];
	articleFederatedDB?: P2PDatabases["articleFederatedDB"];
} | null = null;

/**
 * Sets the currently running P2P node instance.
 * Useful for centralizing shutdown logic.
 * @param instance - The running P2P node instance
 */
export function setRunningInstance(instance: typeof runningInstance) {
	runningInstance = instance;
}

/**
 * Closes all database instances safely.
 * Each DB close is wrapped in try/catch to prevent blocking other closures.
 *
 * @param databases - Object containing optional DB instances
 */
export async function closeDatabases(databases: P2PDatabases) {
	if (!databases) return;

	// --- Debug DB ---
	if (databases.debugDB?.db) {
		try {
			await databases.debugDB.db.close();
			log("✅ Debug DB closed successfully");
		} catch (err: any) {
			log(`⚠️ Debug DB close warning: ${err.message}`);
		}
	} else {
		log("ℹ️  Debug DB not initialized or already null");
	}

	// --- Sources DB ---
	if (databases.articleLocalDB?.db) {
		try {
			await databases.articleLocalDB.db.close();
			log("✅ Sources DB closed successfully");
		} catch (err: any) {
			log(`⚠️ Sources DB close warning: ${err.message}`);
		}
	} else {
		log("ℹ️  Sources DB not initialized or already null");
	}

	// --- Analyzed DB ---
	if (databases.articleAnalyzedDB?.db) {
		try {
			await databases.articleAnalyzedDB.db.close();
			log("✅ Analyzed DB closed successfully");
		} catch (err: any) {
			log(`⚠️ Analyzed DB close warning: ${err.message}`);
		}
	} else {
		log("ℹ️  Analyzed DB not initialized or already null");
	}

	// --- Federated DB ---
	if (databases.articleFederatedDB) {
		log("ℹ️  Federated DB is in-memory; no close required");
	}
}

/**
 * Gracefully shuts down the P2P node and all associated services.
 *
 * Performs the following in sequence with individual error handling:
 * 1. Stops the Libp2p networking node
 * 2. Stops OrbitDB instance
 * 3. Stops Helia (IPFS) instance
 * 4. Closes all database instances using `closeDatabases`
 * 5. Cleans lock files for keystore and database directories
 * 6. Deletes persisted node status file
 * 7. Logs the result and exits process
 */
export async function shutdownP2PNode() {
	if (!runningInstance) return;

	const { libp2p, helia, orbitdb, debugDB, articleLocalDB, articleAnalyzedDB, articleFederatedDB } =
		runningInstance;

	log("🔻 Starting P2P node shutdown...");

	// Close all databases
	log("🔹 Closing individual databases before stopping OrbitDB...");
	if (debugDB || articleLocalDB || articleAnalyzedDB || articleFederatedDB) {
		try {
			const databases = {
				debugDB,
				articleLocalDB,
				articleAnalyzedDB,
				articleFederatedDB,
			} as P2PDatabases;
			await closeDatabases(databases);
		} catch (err: any) {
			log(`❌ Error closing databases: ${err.message}`);
		}
	}

	// Stop OrbitDB
	try {
		if (orbitdb) await orbitdb.stop();
		log("✅ OrbitDB stopped");
	} catch (err: any) {
		log(`❌ Error stopping OrbitDB: ${err.message}`);
	}

	// Stop Helia
	try {
		if (helia) await helia.stop();
		log("✅ Helia stopped");
	} catch (err: any) {
		log(`❌ Error stopping Helia: ${err.message}`);
	}

	// Stop networking
	try {
		await libp2p.stop();
		log("✅ Libp2p stopped");
	} catch (err: any) {
		log(`❌ Error stopping Libp2p: ${err.message}`);
	}

	// Clean lock files
	try {
		cleanLockFiles(process.env.KEYSTORE_PATH || "orbitdb-keystore");
		cleanLockFiles(process.env.DB_PATH || "orbitdb-databases");
		log("✅ Lock files cleaned");
	} catch (err: any) {
		log(`❌ Error cleaning lock files: ${err.message}`);
	}

	// Delete persisted status
	try {
		deleteStatus();
		log("✅ Status file deleted");
	} catch (err: any) {
		log(`❌ Error deleting status: ${err.message}`);
	}

	log("✅ P2P node shutdown complete");
	runningInstance = null;
	process.exit(0);
}

/**
 * Registers process signal handlers to trigger graceful shutdown.
 * Handles:
 * - SIGINT (Ctrl+C)
 * - SIGTERM
 * - uncaughtException
 * - process exit
 */
export function registerShutdownHandlers() {
	process.on("SIGINT", shutdownP2PNode);
	process.on("SIGTERM", shutdownP2PNode);
	process.on("uncaughtException", (err) => {
		log(`Uncaught Exception: ${err.message}`);
		shutdownP2PNode();
	});
	process.on("exit", shutdownP2PNode);
}
