/**
 * @file Standalone bootstrap script for testing Helia + OrbitDB
 * @description
 * This script initializes a libp2p node, Helia/IPFS node, OrbitDB instance,
 * and a typed Documents database. Useful for testing or development.
 */

import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { identify } from "@libp2p/identify";
import type { LogEntry } from "@orbitdb/core";
import { createOrbitDB, Documents } from "@orbitdb/core";
import { createHelia } from "helia";
import { createLibp2p } from "libp2p";

(async () => {
	/**
	 * 1️⃣ Create libp2p node
	 */
	const libp2p = await createLibp2p({
		services: {
			pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }) as any,
			identify: identify(),
		},
	});
	console.log("✅ libp2p node created");

	/**
	 * 2️⃣ Create Helia/IPFS node using the libp2p node
	 */
	const ipfs = await createHelia({ libp2p });
	console.log("✅ Helia/IPFS node created");

	/**
	 * 3️⃣ Initialize OrbitDB
	 */
	const orbitdb = await createOrbitDB({ ipfs });
	console.log("✅ OrbitDB instance created");

	/**
	 * 4️⃣ Create / Open a typed Documents database
	 * In the latest OrbitDB core + Helia, 'address' is required instead of 'name'.
	 */
	const db = await Documents({ indexBy: "_id" })({
		ipfs,
		address: "/orbitdb/zdpuAwzExampleAddress/hello", // provide a valid OrbitDB address
	});
	console.log("✅ Database opened at address:", db.address.toString());

	/**
	 * 5️⃣ Listen for updates from peers
	 */
	db.events.on("update", async (entry: LogEntry) => {
		console.log("🔄 Update received:", entry);
		const allEntries = db.all;
		console.log("📦 All entries:", allEntries);
	});

	/**
	 * 6️⃣ Add an entry to the database
	 */
	const newEntry = { _id: "1", value: "world" };
	await db.put(newEntry);
	console.log("➕ Added entry:", newEntry);

	/**
	 * 7️⃣ Query all entries using the iterator
	 */
	console.log("📜 Database contents via iterator:");
	for await (const [_id, key, doc] of db.iterator({ amount: 100 })) {
		console.log(doc);
	}

	/**
	 * 8️⃣ Cleanup (optional)
	 */
	// await db.close();
	// await orbitdb.stop();
	// await ipfs.stop();
})();
