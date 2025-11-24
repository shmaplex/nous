import type { Helia } from "helia";
import { log } from "@/lib/log";
import { cleanLockFiles } from "../lib/utils";

export interface P2PDatabases {
	debugDB?: { close: () => Promise<void> };
	sourcesDB?: { close: () => Promise<void> };
	analyzedDB?: { close: () => Promise<void> };
	federatedDB?: { close: () => Promise<void> };
}

/**
 * Setup graceful shutdown for P2P node.
 * @param server HTTP server instance
 * @param orbitdb OrbitDB instance
 * @param helia Helia instance
 * @param keystorePath Path to OrbitDB keystore
 * @param dbPath Path to OrbitDB databases
 * @param databases Optional DB references to close
 */
export function setupGracefulShutdown(
	server: any,
	orbitdb: any,
	helia: Helia,
	keystorePath: string,
	dbPath: string,
	databases?: P2PDatabases,
) {
	let shuttingDown = false;

	async function shutdown() {
		if (shuttingDown) return;
		shuttingDown = true;

		try {
			log("Shutting down HTTP server...");
			await new Promise<void>((resolve, reject) =>
				server.close((err: any) => (err ? reject(err) : resolve())),
			);
			log("HTTP server closed");

			log("Shutting down OrbitDB and Helia...");
			await orbitdb.stop();
			await helia.stop();

			if (databases?.debugDB) await databases.debugDB.close();
			if (databases?.sourcesDB) await databases.sourcesDB.close();
			if (databases?.analyzedDB) await databases.analyzedDB.close();
			// Federated database doesn't have a close function
			// if (databases?.federatedDB) await databases.federatedDB.close();

			log("Cleaning LOCK files...");
			cleanLockFiles(keystorePath);
			cleanLockFiles(dbPath);

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

	return shutdown;
}
