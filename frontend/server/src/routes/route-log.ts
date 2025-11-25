// frontend/src/p2p/routes/route-log.ts
import type { ServerResponse } from "node:http";
import { getP2PNode } from "@/node";
import type { DebugLogEntry, RouteHandler } from "@/types";
import { handleError } from "./helpers";

/**
 * GET /debug/logs
 *
 * Returns all debug logs stored in the OrbitDB debug database.
 * Responds with 500 if the debug DB is not initialized or on unexpected errors.
 */
export const getDebugLogsRoute: RouteHandler = {
	method: "GET",
	path: "/debug/logs",
	handler: async ({ res }: { res: ServerResponse }) => {
		res.setHeader("Content-Type", "application/json");

		try {
			const node = await getP2PNode();

			if (!node.debugDB) {
				console.error("Debug DB not initialized in P2P node");
				await handleError(res, "Debug DB not initialized", 500, "error");
				return;
			}

			const db = node.debugDB.db;

			if (!db?.getAll) {
				console.error("Debug DB instance does not have getAll method", db);
				await handleError(res, "Debug DB not ready", 500, "error");
				return;
			}

			const allLogs: DebugLogEntry[] = await db.getAll();

			res.statusCode = 200;
			res.end(JSON.stringify(allLogs));
		} catch (err) {
			console.error("Error in getDebugLogsRoute:", err);
			const message = (err as Error)?.message || "Unknown error";
			await handleError(res, message, 500, "error");
		}
	},
};

/**
 * POST /debug/log
 *
 * Adds a new debug log entry to the OrbitDB debug database.
 * Validates that `message` is present; otherwise responds with 400.
 */
export const postDebugLogRoute: RouteHandler = {
	method: "POST",
	path: "/debug/log",
	handler: async ({
		res,
		body,
	}: {
		res: ServerResponse;
		body?: {
			_id: string;
			message: string;
			level?: "info" | "warn" | "error";
			meta?: Record<string, any>;
		};
	}) => {
		res.setHeader("Content-Type", "application/json");

		if (!body || !body.message) {
			await handleError(res, "Missing log message", 400, "warn");
			return;
		}

		try {
			const { debugDB } = await getP2PNode();

			if (!debugDB) {
				await handleError(res, "Debug DB not initialized", 500, "error");
				return;
			}

			const db = debugDB.db;
			const entry: DebugLogEntry = {
				_id: body._id || crypto.randomUUID(),
				timestamp: new Date().toISOString(),
				message: body.message,
				level: body.level ?? "info",
				meta: body.meta,
			};

			await db.add(entry);

			res.statusCode = 201;
			res.end(JSON.stringify({ success: true, entry }));
		} catch (err) {
			const message = (err as Error)?.message || "Unknown error";
			await handleError(res, message, 500, "error");
		}
	},
};

/**
 * All debug-related routes for OrbitDB logging
 */
export const routes: RouteHandler[] = [getDebugLogsRoute, postDebugLogRoute];
