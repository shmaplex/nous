// frontend/src/orbitdb/server.ts

import { Documents } from "@orbitdb/core";
import { MemoryDatastore } from "datastore-core/memory";
import { createHelia, type Helia } from "helia";

/**
 * Starts an OrbitDB server using a Helia (IPFS) node with in-memory storage.
 *
 * This server initializes two document stores:
 * 1. `local-articles` for raw/local content.
 * 2. `analyzed-articles` for articles with analysis metadata.
 *
 * Both stores index documents by their `url`.
 */
async function startServer() {
	/** Helia node instance (IPFS) */
	const ipfs: Helia = await createHelia({
		datastore: new MemoryDatastore(), // in-memory storage for simplicity/testing
	});

	// Create document store generators
	const LocalStoreGen = Documents({ indexBy: "url" });
	const AnalyzedStoreGen = Documents({ indexBy: "url" });

	/** Document store for local articles */
	const localFeed = await LocalStoreGen({ ipfs, address: "local-articles" });

	/** Document store for analyzed articles */
	const analyzedFeed = await AnalyzedStoreGen({ ipfs, address: "analyzed-articles" });

	console.log("OrbitDB server running...");
	console.log("Local feed address:", localFeed.address);
	console.log("Analyzed feed address:", analyzedFeed.address);

	// Gracefully handle shutdown
	process.on("SIGINT", async () => {
		console.log("Shutting down OrbitDB server...");
		await ipfs.stop(); // stop Helia node, closes all stores
		process.exit();
	});
}

// Start the server
startServer();
