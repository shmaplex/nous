import type { Helia } from "helia";

import { cleanLockFiles, log } from "../lib/utils";

export function setupGracefulShutdown(
	server: any,
	newsDB: any,
	orbitdb: any,
	helia: Helia,
	keystorePath: string,
	dbPath: string,
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
			await newsDB.close();
			await orbitdb.stop();
			await helia.stop();

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
