// frontend/src/p2p/routes/route-status.ts
import fs from "node:fs";
import type { ServerResponse } from "node:http";
import path from "node:path";
import { STATUS_FILE_PATH } from "@/constants";
import type { NodeStatus, RouteHandler } from "@/types";
import { handleError } from "./helpers";

/**
 * GET /status
 * Returns the latest persisted NodeStatus from disk
 */
export const getStatusRoute: RouteHandler = {
	method: "GET",
	path: "/status",
	handler: async ({ res }: { res: ServerResponse }) => {
		res.setHeader("Content-Type", "application/json");

		try {
			let persisted: Partial<NodeStatus> = {};
			if (fs.existsSync(STATUS_FILE_PATH)) {
				const raw = fs.readFileSync(STATUS_FILE_PATH, "utf-8");
				persisted = JSON.parse(raw) || {};
			}

			const status: NodeStatus = {
				running: false,
				connected: false,
				syncing: false,
				orbitConnected: false,
				peers: [],
				port: 9001,
				logs: [],
				...persisted,
				lastSync: persisted?.lastSync ?? null, // coerce to string | null
			};

			res.statusCode = 200;
			res.end(JSON.stringify(status));
		} catch (err) {
			await handleError(res, `Failed to load status file: ${(err as Error).message}`, 500, "error");
		}
	},
};

/**
 * POST /status
 * Updates the persisted NodeStatus by merging the provided fields
 */
export const updateStatusRoute: RouteHandler = {
	method: "POST",
	path: "/status",
	handler: async ({ res, body }: { res: ServerResponse; body?: Partial<NodeStatus> }) => {
		res.setHeader("Content-Type", "application/json");

		try {
			if (!body || typeof body !== "object") {
				await handleError(res, "Invalid body, expected JSON object", 400, "warn");
				return;
			}

			// Load existing persisted status
			let persisted: Partial<NodeStatus> = {};
			if (fs.existsSync(STATUS_FILE_PATH)) {
				const raw = fs.readFileSync(STATUS_FILE_PATH, "utf-8");
				persisted = JSON.parse(raw) || {};
			}

			// Merge new status
			const updated: NodeStatus = {
				running: false,
				connected: false,
				syncing: false,
				orbitConnected: false,
				peers: [],
				port: 9001,
				logs: [],
				...persisted,
				...body,
				lastSync:
					body?.syncing === false
						? new Date().toISOString()
						: (persisted?.lastSync ?? body?.lastSync ?? null),
			};

			// Auto-update lastSync if syncing switched to false
			if (body.syncing === false) {
				updated.lastSync = new Date().toISOString();
			}

			// Persist to disk
			const dir = path.dirname(STATUS_FILE_PATH);
			fs.mkdirSync(dir, { recursive: true });
			fs.writeFileSync(STATUS_FILE_PATH, JSON.stringify(updated, null, 2));

			res.statusCode = 200;
			res.end(JSON.stringify(updated));
		} catch (err) {
			await handleError(
				res,
				`Failed to update status file: ${(err as Error).message}`,
				500,
				"error",
			);
		}
	},
};

/**
 * DELETE /status
 * Removes the persisted status file entirely
 */
export const deleteStatusRoute: RouteHandler = {
	method: "DELETE",
	path: "/status",
	handler: async ({ res }: { res: ServerResponse }) => {
		res.setHeader("Content-Type", "application/json");

		try {
			if (fs.existsSync(STATUS_FILE_PATH)) {
				fs.unlinkSync(STATUS_FILE_PATH);
			}

			res.statusCode = 200;
			res.end(JSON.stringify({ deleted: true }));
		} catch (err) {
			await handleError(
				res,
				`Failed to delete status file: ${(err as Error).message}`,
				500,
				"error",
			);
		}
	},
};

// Export all backend routes
export const routes: RouteHandler[] = [getStatusRoute, updateStatusRoute, deleteStatusRoute];
