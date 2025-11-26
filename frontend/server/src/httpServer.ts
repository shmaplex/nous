// frontend/src/p2p/httpServer.ts
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { NodeStatus, RouteHandler } from "@/types";
import { log } from "./lib/log.server";

import * as articleFederatedRoutes from "./routes/route-articles-federated";
import * as articleLocalRoutes from "./routes/route-articles-local";
import * as logRoutes from "./routes/route-log";
import * as statusRoutes from "./routes/route-status";

export const BASE_URL = "http://localhost";

export const routes: RouteHandler[] = [
	...logRoutes.routes,
	...statusRoutes.routes,
	...articleLocalRoutes.routes,
	...articleFederatedRoutes.routes,
];

export interface HttpServerContext {
	status: NodeStatus;
	orbitdbConnected: boolean;
	httpPort?: number;
	[key: string]: any;
}

export function createHttpServer(
	httpPort: number,
	context: HttpServerContext,
): { server: Server; shutdown: () => Promise<void> } {
	const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
		res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
		res.setHeader("Content-Type", "application/json");

		if (req.method === "OPTIONS") {
			res.writeHead(204);
			res.end();
			return;
		}

		try {
			//------------------------------------------------------------
			// Read request body safely (chunked, production-safe)
			//------------------------------------------------------------
			const chunks: Buffer[] = [];

			req.on("data", (chunk) => {
				chunks.push(chunk);
			});

			req.on("end", async () => {
				const rawBody = Buffer.concat(chunks).toString("utf8");

				//------------------------------------------------------------
				// Match route
				//------------------------------------------------------------
				const route = routes.find(
					(r) => r.method === req.method && (req.url === r.path || req.url?.startsWith(r.path)),
				);

				if (!route) {
					res.statusCode = 404;
					res.end(JSON.stringify({ error: "not found" }));
					return;
				}

				//------------------------------------------------------------
				// Parse JSON body (if present)
				//------------------------------------------------------------
				let parsedBody: any;

				if (rawBody.trim().length > 0) {
					try {
						parsedBody = JSON.parse(rawBody);
					} catch {
						res.statusCode = 400;
						res.end(JSON.stringify({ error: "Invalid JSON body" }));
						return;
					}
				}

				//------------------------------------------------------------
				// Zod validation (if a bodySchema exists)
				//------------------------------------------------------------
				let finalBody = parsedBody;

				if (route.bodySchema) {
					try {
						finalBody = route.bodySchema.parse(parsedBody ?? {});
					} catch (err) {
						res.statusCode = 400;
						res.end(
							JSON.stringify({
								error: "Invalid request body",
								details: (err as Error).message,
							}),
						);
						return;
					}
				}

				//------------------------------------------------------------
				// Execute route handler
				//------------------------------------------------------------
				await route.handler({
					...context,
					req,
					res,
					body: finalBody,
				});
			});
		} catch (err) {
			res.statusCode = 500;
			res.end(JSON.stringify({ error: (err as Error).message }));
		}
	});

	//------------------------------------------------------------
	// Shutdown helper
	//------------------------------------------------------------
	async function shutdown() {
		return new Promise<void>((resolve, reject) => {
			server.close((err) => {
				if (err) {
					log(`❌ Error closing HTTP server: ${err.message}`);
					return reject(err);
				}
				log("✅ HTTP server closed");
				resolve();
			});
		});
	}

	server.listen(httpPort, () => {
		console.log(`P2P node HTTP API running on ${BASE_URL}:${httpPort}`);
	});

	return { server, shutdown };
}
