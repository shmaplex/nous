// server/src/server/log.server.ts

/**
 * Simple console log function for P2P backend code
 */
export function log(message: string, level: "info" | "warn" | "error" = "info") {
	const timestamp = new Date().toISOString();
	const formatted = `[P2P] ${timestamp} - ${message}`;

	switch (level) {
		case "warn":
			console.warn(formatted);
			break;
		case "error":
			console.error(formatted);
			break;
		default:
			console.log(formatted);
	}
}

/**
 * Stub function: addDebugLog now just logs to console
 */
export async function addDebugLog(entry: { message: string; level?: "info" | "warn" | "error" }) {
	log(entry.message, entry.level ?? "info");
}
