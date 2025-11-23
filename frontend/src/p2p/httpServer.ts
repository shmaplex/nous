import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { Article, NodeStatus, RouteHandler } from "../types";
import { articlesRoute, deleteArticleRoute, saveArticleRoute, statusRoute } from "./routes";

const routes: RouteHandler[] = [articlesRoute, statusRoute, saveArticleRoute, deleteArticleRoute];

/**
 * Creates and starts an HTTP server to expose P2P node functionality.
 */
export function createHttpServer(
	httpPort: number,
	status: NodeStatus,
	getAllArticles: () => Promise<Article[]>,
	saveArticle: (doc: Article) => Promise<void>,
	deleteArticle: (url: string) => Promise<void>,
	orbitdbConnected: boolean,
): Server {
	const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
		res.setHeader("Content-Type", "application/json");
		try {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", async () => {
				const route = routes.find(
					(r) => r.method === req.method && (req.url === r.path || req.url?.startsWith(r.path)),
				);

				if (route) {
					await route.handler({
						res,
						getAllArticles,
						saveArticle,
						deleteArticle,
						status,
						orbitdbConnected,
						httpPort,
						body: body ? JSON.parse(body) : undefined,
					});
				} else {
					res.statusCode = 404;
					res.end(JSON.stringify({ error: "not found" }));
				}
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
