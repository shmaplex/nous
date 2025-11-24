// frontend/src/lib/utils.ts
import * as fs from "node:fs";
import * as path from "node:path";
import { dagCbor } from "@helia/dag-cbor";
import type { Helia } from "helia";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import type { NodeStatus } from "../types";

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
 * Logs a message to the console with timestamp and [P2P NODE] prefix
 * @param message - The message to log
 */
export function log(message: string) {
	console.log(`[P2P NODE] ${new Date().toISOString()} - ${message}`);
}

/**
 * Updates the global NodeStatus and optionally writes it to a JSON file.
 * @param status - The NodeStatus object to update
 * @param connected - Whether the node is connected
 * @param syncing - Whether the node is syncing
 * @param push - Whether to write status to /data/p2p-status.json
 */
export function updateStatus(
	status: NodeStatus,
	connected: boolean,
	syncing: boolean,
	push = true,
) {
	status.connected = connected;
	status.syncing = syncing;

	if (!syncing) status.lastSync = new Date().toISOString();

	if (push) {
		try {
			const statusDir = path.resolve("../data");
			fs.mkdirSync(statusDir, { recursive: true }); // create folder if missing

			fs.writeFileSync(
				path.join(statusDir, "p2p-status.json"),
				JSON.stringify({ ...status, port: process.env.HTTP_PORT }),
			);
		} catch (err) {
			log(`Failed to write status file: ${(err as Error).message}`);
		}
	}
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
