// frontend/server/src/lib/utils.server.ts
import fs from "node:fs";
import path from "node:path";

/**
 * Recursively removes OrbitDB lock files from the specified directory.
 *
 * OrbitDB uses LevelDB under the hood, and LevelDB creates a file named `LOCK`
 * inside each database directory. These lock files prevent the database from
 * being opened by more than one process at the same time.
 *
 * In typical server environments, this is fine. But in development environments
 * — especially when using Wails + embedded Node + hot rebuilds — leftover `LOCK`
 * files can get stranded after a crash or forced reload.
 *
 * When these stale lock files remain, OrbitDB will refuse to open the database,
 * throwing errors such as:
 *
 *   "IO error: lock /orbitdb/.../LOCK: Resource temporarily unavailable"
 *
 * This helper safely removes stale LOCK files before initializing OrbitDB,
 * ensuring that the node can start cleanly.
 *
 * ⚠️ NOTE:
 * This function only removes files literally named `LOCK`. It does NOT touch
 * any database content or metadata. Lock files are safe to delete when the node
 * is not running.
 *
 * @param dir - The root directory to scan for OrbitDB lock files.
 *
 * @example
 * ```ts
 * await cleanLockFiles("/Users/me/orbitdb-databases");
 * ```
 */
export async function cleanLockFiles(dir: string): Promise<void> {
	if (!fs.existsSync(dir)) {
		console.log("cleanLockFiles: Unable to find the directory", dir);
		return;
	}

	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.resolve(path.join(dir, entry.name));

		if (entry.isDirectory()) {
			// Only dive into relevant subdirectories
			if (
				["_heads", "_index"].includes(entry.name) ||
				(entry.name !== "_heads" && entry.name !== "_index")
			) {
				await cleanLockFiles(fullPath);
			}
		} else if (entry.name === "LOCK") {
			try {
				fs.unlinkSync(fullPath);
				console.log(`Removed lock file: ${fullPath}`);
			} catch (err) {
				console.warn(`Failed to remove lock file: ${fullPath}`, err);
			}
		}
	}
}
