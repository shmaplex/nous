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
	if (!fs.existsSync(dir)) return;

	for (const file of fs.readdirSync(dir)) {
		const fullPath = path.join(dir, file);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			// Dive into subdirectories recursively
			await cleanLockFiles(fullPath);
		} else if (file === "LOCK") {
			// OrbitDB / LevelDB lock file — safe to remove if leftover
			try {
				fs.unlinkSync(fullPath);
			} catch {
				// Silently fail — better to continue than crash
			}
		}
	}
}
