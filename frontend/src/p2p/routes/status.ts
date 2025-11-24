import type { ServerResponse } from "node:http";
import type { NodeStatus, RouteHandler } from "../../types";

/**
 * GET /status
 * Returns node status
 */
export const statusRoute: RouteHandler = {
	method: "GET",
	path: "/status",
	handler: async (context: {
		status?: NodeStatus;
		orbitdbConnected?: boolean;
		httpPort?: number;
		res: ServerResponse;
	}) => {
		const { status, orbitdbConnected, httpPort, res } = context;

		if (!status) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: "Node status not available" }));
			return;
		}

		const full = {
			...status,
			orbitConnected: orbitdbConnected ?? false,
			syncing: status.syncing ?? false,
			port: httpPort ?? 0,
			logs: [],
		};

		res.end(JSON.stringify(full));
	},
};

export const routes: RouteHandler[] = [statusRoute];
