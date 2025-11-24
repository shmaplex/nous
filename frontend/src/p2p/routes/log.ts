// frontend/src/p2p/routes/log.ts
import type { ServerResponse } from "node:http";
import type { DebugLogEntry, RouteHandler } from "@/types";
import { getP2PNode } from "../node";

/**
 * GET /debug/logs
 * Returns all debug logs from the OrbitDB debug database
 */
export const getDebugLogsRoute: RouteHandler = {
	method: "GET",
	path: "/debug/logs",
	handler: async ({ res }: { res: ServerResponse<any> }) => {
		try {
			const { debugDB } = await getP2PNode();
			if (!debugDB) {
				res.statusCode = 500;
				res.end(JSON.stringify({ error: "Debug DB not initialized" }));
				return;
			}

			const db = debugDB.db;
			const allLogs: DebugLogEntry[] = await db.getAll();
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify(allLogs));
		} catch (err) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: (err as Error).message }));
		}
	},
};

/**
 * POST /debug/log
 * Add a debug log entry to the OrbitDB debug database
 */
export const postDebugLogRoute: RouteHandler = {
	method: "POST",
	path: "/debug/log",
	handler: async ({
		res,
		body,
	}: {
		res: ServerResponse<any>;
		body?: {
			_id: string;
			message: string;
			level?: "info" | "warn" | "error";
			meta?: Record<string, any>;
		};
	}) => {
		if (!body || !body.message) {
			res.statusCode = 400;
			res.end(JSON.stringify({ error: "Missing log message" }));
			return;
		}

		try {
			const { debugDB } = await getP2PNode();
			if (!debugDB) {
				res.statusCode = 500;
				res.end(JSON.stringify({ error: "Debug DB not initialized" }));
				return;
			}

			const db = debugDB.db;
			// const db = await debugDB;
			const entry: DebugLogEntry = {
				_id: body._id,
				timestamp: new Date().toISOString(),
				message: body.message,
				level: body.level ?? "info",
				meta: body.meta,
			};

			await db.add(entry);

			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify({ success: true }));
		} catch (err) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: (err as Error).message }));
		}
	},
};

// Export all debug routes
export const routes: RouteHandler[] = [getDebugLogsRoute, postDebugLogRoute];
