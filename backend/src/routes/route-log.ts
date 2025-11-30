// frontend/src/p2p/routes/route-log.ts
import type { ServerResponse } from "node:http";
import type { DebugLogEntry, RouteHandler } from "@/types";
import { handleError } from "./helpers";

/**
 * GET /debug/logs
 *
 * Returns all debug logs via the injected getAll() function.
 */
export const getDebugLogsRoute: RouteHandler = {
	method: "GET",
	path: "/debug/logs",
	handler: async ({
		getAll,
		res,
	}: {
		getAll?: () => Promise<DebugLogEntry[]>;
		res: ServerResponse;
	}) => {
		res.setHeader("Content-Type", "application/json");

		if (!getAll) {
			await handleError(res, "Debug DB getAll() not provided", 500, "error");
			return;
		}

		try {
			const logs = await getAll();
			res.statusCode = 200;
			res.end(JSON.stringify(logs));
		} catch (err) {
			const msg = (err as Error).message || "Unknown error reading debug logs";
			await handleError(res, msg, 500, "error");
		}
	},
};

/**
 * POST /debug/log
 *
 * Adds a log entry using the injected add() function.
 */
export const postDebugLogRoute: RouteHandler = {
	method: "POST",
	path: "/debug/log",
	handler: async ({
		add,
		res,
		body,
	}: {
		add?: (entry: DebugLogEntry) => Promise<void>;
		res: ServerResponse;
		body?: {
			_id?: string;
			timestamp?: string;
			message: string;
			level?: "info" | "warn" | "error";
			meta?: Record<string, any>;
		};
	}) => {
		if (!add) {
			await handleError(res, "Debug DB add() not provided", 500, "error");
			return;
		}
		console.log("body", body);

		if (!body || !body.message) {
			await handleError(res, "Missing log message", 400, "warn");
			return;
		}

		try {
			const entry: DebugLogEntry = {
				_id: body._id || crypto.randomUUID(),
				timestamp: body.timestamp || new Date().toISOString(),
				message: body.message,
				level: body.level ?? "info",
				meta: body.meta ?? {},
			};

			await add(entry);

			res.statusCode = 201;
			res.end(JSON.stringify({ success: true, entry }));
		} catch (err) {
			const msg = (err as Error).message || "Unknown error writing debug log";
			await handleError(res, msg, 500, "error");
		}
	},
};

export const routes: RouteHandler[] = [getDebugLogsRoute, postDebugLogRoute];
