// frontend/src/p2p/httpServer.ts
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { NodeStatus, RouteHandler } from "../types";
// external routes (see /routes)
import * as deleteRoutes from "./routes/article-delete";
import * as saveRoutes from "./routes/article-save";
import * as federatedRoutes from "./routes/articles-federated";
import * as sourcesRoutes from "./routes/articles-sources";
import * as statusRoutes from "./routes/status";

export const routes: RouteHandler[] = [
	...federatedRoutes.routes,
	...sourcesRoutes.routes,
	...deleteRoutes.routes,
	...statusRoutes.routes,
	...saveRoutes.routes,
];

/**
 * Context type for the HTTP server.
 * Contains status, connection info, and optional DB handler functions.
 */
export interface HttpServerContext {
	status: NodeStatus;
	orbitdbConnected: boolean;
	httpPort?: number;

	/** Allow any future handlers to be added without modifying this type */
	[key: string]: any;
}

/**
 * Creates and starts an HTTP server to expose P2P node functionality.
 *
 * Routes are defined in ./routes and can include optional Zod body validation.
 *
 * @param httpPort - Port to listen on
 * @param context - Server context with DB functions and status
 * @returns HTTP Server instance
 */
export function createHttpServer(httpPort: number, context: HttpServerContext): Server {
	const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
		res.setHeader("Content-Type", "application/json");

		try {
			let rawBody = "";
			req.on("data", (chunk) => {
				rawBody += chunk;
			});

			req.on("end", async () => {
				const route = routes.find(
					(r) => r.method === req.method && (req.url === r.path || req.url?.startsWith(r.path)),
				);

				if (!route) {
					res.statusCode = 404;
					res.end(JSON.stringify({ error: "not found" }));
					return;
				}

				// Validate request body if a Zod schema is provided
				let validatedBody: unknown;
				if (route.bodySchema && rawBody) {
					try {
						validatedBody = route.bodySchema.parse(JSON.parse(rawBody));
					} catch (err) {
						res.statusCode = 400;
						res.end(
							JSON.stringify({ error: "Invalid request body", details: (err as Error).message }),
						);
						return;
					}
				}

				// Call route handler with merged context
				await route.handler({
					...context,
					res,
					body: validatedBody,
				});
			});
		} catch (err) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: (err as Error).message }));
		}
	});

	server.listen(httpPort, () => {
		console.log(`P2P node HTTP API running on http://127.0.0.1:${httpPort}`);
	});

	return server;
}
