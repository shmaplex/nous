// frontend/src/lib/utils.ts
import fs from "node:fs";
import path from "node:path";
import { dagCbor } from "@helia/dag-cbor";
import type { Helia } from "helia";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import { STATUS_FILE_NAME, STATUS_FILE_PATH } from "@/constants/status";
import type { NodeStatus } from "../types";
import { log } from "./log";

// Internal in-memory status singleton
let status: NodeStatus = {
	running: false,
	connected: false,
	syncing: false,
	orbitConnected: false,
	lastSync: null,
	peers: [],
	logs: [],
	port: 9001,
};

/**
 * Combine multiple class names into a single string, ignoring falsy values.
 *
 * Useful for conditional CSS classes, e.g., Tailwind or dynamic styling.
 *
 * @param classes - An array of strings or falsy values (`undefined`, `null`, `false`) to combine
 * @returns A single string of classes separated by spaces
 *
 * @example
 * ```ts
 * cn("btn", isPrimary && "btn-primary", null, "mt-4");
 * // => "btn btn-primary mt-4"
 * ```
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
	return classes.filter(Boolean).join(" ");
}

/**
 * Store arbitrary JSON in IPFS using DAG-CBOR and return the CID.
 */
export async function storeInIPFS<T extends Record<string, any>>(
	ipfs: Helia,
	content: T,
): Promise<string> {
	const dag = dagCbor(ipfs);
	const cid = await dag.add(content);
	return cid.toString();
}

/**
 * Generate a content-addressed CID for a JSON-serializable object.
 *
 * This is useful for creating unique, deterministic IDs for documents
 * that can be referenced across IPFS/OrbitDB/Helia.
 *
 * @template T - The type of object to generate a CID for
 * @param doc - Any JSON-serializable object
 * @returns A string representation of the CID
 *
 * @example
 * ```ts
 * const article = { title: "Hello", url: "https://..." };
 * const cid = await generateCID(article);
 * console.log(cid); // "bafy..."
 * ```
 */
export async function generateCID<T extends Record<string, any>>(doc: T): Promise<string> {
	const bytes = new TextEncoder().encode(JSON.stringify(doc));
	const hash = await sha256.digest(bytes);
	const cid = CID.create(1, 0x55 /* raw */, hash); // 0x55 = raw
	return cid.toString();
}

/**
 * Recursively cleans all "LOCK" files in the specified directory.
 * @param dir - Directory to clean
 */
export async function cleanLockFiles(dir: string) {
	const absoluteDir = path.resolve(dir);
	if (!fs.existsSync(absoluteDir)) return;

	for (const file of fs.readdirSync(absoluteDir)) {
		const filePath = path.join(absoluteDir, file);
		const stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			await cleanLockFiles(filePath);
		} else if (file === "LOCK") {
			try {
				fs.unlinkSync(filePath);
				log(`Removed LOCK: ${filePath}`);
			} catch (err: unknown) {
				log(`Failed to remove LOCK: ${filePath} ${(err as Error).message}`);
			}
		}
	}
}

/**
 * Reads and returns the latest persisted NodeStatus from /data/p2p-status.json.
 * If the file does not exist or is malformed, returns null.
 */
export function loadLatestStatus(): Partial<NodeStatus> | null {
	try {
		const statusFilePath = path.resolve(STATUS_FILE_PATH);

		if (!fs.existsSync(statusFilePath)) {
			return null; // No persisted status
		}

		const raw = fs.readFileSync(statusFilePath, "utf-8");
		const parsed = JSON.parse(raw);

		// Validate minimal structure
		if (typeof parsed !== "object" || parsed === null) {
			log("❌ Invalid status file format");
			return null;
		}

		return parsed as Partial<NodeStatus>;
	} catch (err) {
		log(`❌ Failed to load status file: ${(err as Error).message}`);
		return null;
	}
}

/**
 * Updates the global NodeStatus by merging only provided fields.
 * Missing fields in newStatus do NOT overwrite existing status.
 * Always hydrates the in-memory status from disk first.
 */
export function updateStatus(newStatus: Partial<NodeStatus>, push = true): NodeStatus {
	// Hydrate from disk
	const persisted = loadLatestStatus();
	if (persisted) {
		status = { ...status, ...persisted };
	}

	// Merge new fields
	status = { ...status, ...newStatus };

	// Auto-update lastSync if syncing switched to false
	if (newStatus.syncing === false) {
		status.lastSync = new Date().toISOString();
	}

	// Persist to disk
	if (push) {
		try {
			const statusDir = path.resolve("data");
			fs.mkdirSync(statusDir, { recursive: true });

			fs.writeFileSync(path.join(statusDir, STATUS_FILE_NAME), JSON.stringify(status, null, 2));
		} catch (err) {
			log(`Failed to write status file: ${(err as Error).message}`);
		}
	}

	return status;
}

/**
 * Loads the persisted status (if exists) and merges it into the provided NodeStatus.
 */
export function hydrateStatusFromFile(status: NodeStatus) {
	const latest = loadLatestStatus();
	if (!latest) return status;

	Object.assign(status, latest);
	return status;
}

/**
 * Clears the global NodeStatus and removes the persisted status file.
 * @param status - The NodeStatus object to update
 */
export function clearStatus(status: NodeStatus) {
	// Reset in-memory status
	status.connected = false;
	status.syncing = false;
	status.running = false;
	status.orbitConnected = false;
	status.lastSync = null;
	status.peers = [];
	status.logs = [];

	// Remove persisted status file
	try {
		const statusFilePath = path.resolve(STATUS_FILE_PATH);
		if (fs.existsSync(statusFilePath)) {
			fs.unlinkSync(statusFilePath);
			log("✅ P2P status file removed");
		}
	} catch (err) {
		log(`Failed to remove status file: ${(err as Error).message}`);
	}
}
