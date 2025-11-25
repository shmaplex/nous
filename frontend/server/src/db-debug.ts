// frontend/src/lib/db-debug.ts
import type { OrbitDB } from "@orbitdb/core";
import { log } from "@/lib/log.server";
import type { DebugLogEntry } from "@/types/log";

// Explicit type for the debug DB instance
export interface DebugDB {
	db: any;
	add: (entry: DebugLogEntry) => Promise<void>;
	getAll: () => Promise<DebugLogEntry[]>;
}

// Keep a singleton for debugDB
let debugDBInstance: DebugDB | null = null;

/**
 * Sets up a debug logs DB in OrbitDB.
 * Safe to call multiple times; will return existing instance.
 *
 * @param orbitdb - Existing OrbitDB instance.
 * @returns DB instance and helper methods for logging and retrieving entries.
 */
export async function setupDebugDB(orbitdb: OrbitDB) {
	if (debugDBInstance) {
		log("🟢 Debug DB already initialized, skipping setup");
		return debugDBInstance;
	}

	const db = (await orbitdb.open("nous.debug.logs", {
		type: "documents",
		meta: { indexBy: "timestamp" },
	})) as any;

	console.log("debugDB -> ", db);

	// Log updates from peers
	db.events.on("update", async (entry: any) => {
		log(`🔄 Debug update from peer: ${JSON.stringify(entry)}`);
		const all = await db.query(() => true);
		log(`📦 Debug DB entries: ${all.length}`);
	});

	// Add a new debug entry
	async function add(entry: DebugLogEntry) {
		await db.put(entry);
		log(`📝 Debug log added: ${entry.timestamp} - ${entry.message}`);
	}

	// Retrieve all debug entries
	async function getAll(): Promise<DebugLogEntry[]> {
		return db.query(() => true) ?? [];
	}

	debugDBInstance = { db, add, getAll };
	log(`✅ Debug DB setup complete with ${db.address?.toString()}`);

	// Optionally, write initial node status as first log
	await add({
		_id: `startup-${Date.now()}`,
		timestamp: new Date().toISOString(),
		message: "Node debug DB initialized",
		level: "info",
		meta: { port: process.env.HTTP_PORT },
	});

	return debugDBInstance;
}
