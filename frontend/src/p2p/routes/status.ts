// frontend/src/p2p/statusRoute.ts
import fs from "node:fs";
import type { ServerResponse } from "node:http";
import path from "node:path";
import { STATUS_FILE_PATH } from "@/constants/status";
import { log } from "@/lib/log";
import type { NodeStatus, RouteHandler } from "@/types";

/**
 * GET /status
 * Returns the latest persisted NodeStatus from disk
 */
export const getStatusRoute: RouteHandler = {
	method: "GET",
	path: "/status",
	handler: async ({ res }: { res: ServerResponse }) => {
		try {
			let persisted: Partial<NodeStatus> = {};
			if (fs.existsSync(STATUS_FILE_PATH)) {
				const raw = fs.readFileSync(STATUS_FILE_PATH, "utf-8");
				persisted = JSON.parse(raw) || {};
			}

			res.statusCode = 200;
			res.setHeader("Content-Type", "application/json");
			res.end(
				JSON.stringify({
					running: false,
					connected: false,
					syncing: false,
					orbitConnected: false,
					peers: [],
					port: 9001,
					logs: [],
					...persisted,
				}),
			);
		} catch (err) {
			log(`❌ Failed to load status file: ${(err as Error).message}`);
			res.statusCode = 500;
			res.end(JSON.stringify({ error: (err as Error).message }));
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
		try {
			if (!body || typeof body !== "object") {
				res.statusCode = 400;
				res.end(JSON.stringify({ error: "Invalid body, expected JSON object" }));
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
						: (persisted?.lastSync ?? body?.lastSync ?? null), // ensure string | null
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
			res.setHeader("Content-Type", "application/json");
			res.end(JSON.stringify(updated));
		} catch (err) {
			log(`❌ Failed to update status file: ${(err as Error).message}`);
			res.statusCode = 500;
			res.end(JSON.stringify({ error: (err as Error).message }));
		}
	},
};

// Export all backend routes
export const routes: RouteHandler[] = [getStatusRoute, updateStatusRoute];
