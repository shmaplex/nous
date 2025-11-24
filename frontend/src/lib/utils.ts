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

const BASE_URL = "http://localhost:9001"; // or dynamic config

// In-memory status
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
 * Fetch the latest NodeStatus from the backend
 */
export async function loadLatestStatus(): Promise<Partial<NodeStatus> | null> {
	try {
		const res = await fetch(`${BASE_URL}/status`);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const data = (await res.json()) as NodeStatus;
		status = data; // update local singleton
		return data;
	} catch (err) {
		log(`❌ Failed to fetch latest status: ${(err as Error).message}`);
		return null;
	}
}

/**
 * Update NodeStatus via backend POST /status
 */
export async function updateStatus(newStatus: Partial<NodeStatus>): Promise<NodeStatus> {
	try {
		const res = await fetch(`${BASE_URL}/status`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(newStatus),
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const updated = (await res.json()) as NodeStatus;
		status = updated;
		return updated;
	} catch (err) {
		log(`❌ Failed to update status: ${(err as Error).message}`);
		// fallback: merge locally
		status = { ...status, ...newStatus };
		if (newStatus.syncing === false) status.lastSync = new Date().toISOString();
		return status;
	}
}

/**
 * Hydrate an existing status object from backend
 */
export async function hydrateStatusFromServer(statusObj: NodeStatus) {
	const latest = await loadLatestStatus();
	if (!latest) return statusObj;
	Object.assign(statusObj, latest);
	return statusObj;
}

/**
 * Clear local in-memory status (frontend only)
 */
export function clearStatus(statusObj: NodeStatus) {
	statusObj.connected = false;
	statusObj.syncing = false;
	statusObj.running = false;
	statusObj.orbitConnected = false;
	statusObj.lastSync = null;
	statusObj.peers = [];
	statusObj.logs = [];
}
