import * as fs from "node:fs";
import * as path from "node:path";
import type { NodeStatus } from "../types";

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
