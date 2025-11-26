// frontend/server/src/routes/helpers.ts
import type { ServerResponse } from "node:http";
import { addDebugLog } from "@/lib/log.server";
import { getP2PNode } from "@/node";

/**
 * Handles an HTTP error response in a standardized way.
 *
 * This function sets the response status code and JSON body, logs the error
 * to the debug system, and ensures the response is properly terminated.
 *
 * @param res - The Node.js HTTP server response object
 * @param message - Human-readable error message to send in the response and log
 * @param code - HTTP status code (default: 500)
 * @param level - Severity level for logging: "info", "warn", or "error" (default: "error")
 *
 * @example
 * ```ts
 * // Inside a route handler
 * if (!user) {
 *   await handleError(res, "User not found", 404, "warn");
 *   return;
 * }
 * ```
 */
export async function handleError(
	res: ServerResponse,
	message: string,
	code = 500,
	level: "info" | "warn" | "error" = "error",
) {
	const { debugDB } = await getP2PNode();
	// Ensure the response will be JSON
	res.setHeader("Content-Type", "application/json");
	res.statusCode = code;

	try {
		// Log the error to the debug db
		if (debugDB) {
			await debugDB.add({
				_id: crypto.randomUUID(),
				timestamp: new Date().toISOString(),
				message,
				level,
			});
		} else {
			// Log the error asynchronously; failures are silently ignored
			await addDebugLog({ message, level });
		}
	} catch {}

	// End the HTTP response with JSON payload
	res.end(JSON.stringify({ error: message }));
}
