/**
 * @file useArticleLoader.ts
 * @description
 * Reusable loader for fetching + polling local OrbitDB article databases.
 * Each view (Workbench, Reading, etc.) can independently use this hook
 * to load its own required article set.
 */

import { useEffect, useRef, useState } from "react";
import { loadLocalArticles } from "@/lib/articles/local";
import { addDebugLog } from "@/lib/log";
import { fetchArticlesBySources, getAvailableSources } from "@/lib/sources";
import type { Article } from "@/types";
import { useNodeStatus } from "./useNodeStatus";

const POLL_INTERVAL = 5000;
const MAX_POLL_ATTEMPTS = 25;

export function useArticleLoader() {
	const status = useNodeStatus();

	const [loading, setLoading] = useState(true);
	const [loadingStatus, setLoadingStatus] = useState("Starting up…");
	const [progress, setProgress] = useState(5);
	const [articles, setArticles] = useState<Article[]>([]);

	const fetchOnceRef = useRef(false);

	useEffect(() => {
		const run = async () => {
			if (!status.running || !status.connected || !status.orbitConnected) {
				setLoadingStatus("Waiting for P2P node and databases…");
				setProgress(10);
				return;
			}

			if (fetchOnceRef.current) return;
			fetchOnceRef.current = true;

			await new Promise((r) => setTimeout(r, 1000));

			setLoadingStatus("Loading news sources…");
			setProgress(20);

			const sources = await getAvailableSources();

			setLoadingStatus("Fetching articles from sources…");
			setProgress(40);

			try {
				await fetchArticlesBySources(sources);
			} catch (err) {
				console.error("Fetch failed:", err);
				setLoadingStatus("Failed to fetch external sources.");
				setProgress(0);
				return;
			}

			setLoadingStatus("Waiting for articles to populate…");
			setProgress(60);

			let attempts = 0;
			let found: Article[] = [];

			while (attempts < MAX_POLL_ATTEMPTS) {
				const local = await loadLocalArticles();
				if (Array.isArray(local) && local.length > 0) {
					found = local;
					break;
				}
				attempts++;
				await new Promise((r) => setTimeout(r, POLL_INTERVAL));
			}

			if (found.length === 0) {
				setLoadingStatus("No articles found. Try again?");
				setProgress(100);
				setLoading(false);
				return;
			}

			setArticles(found);
			setProgress(100);
			setLoading(false);

			await addDebugLog({
				message: `Loaded ${found.length} local articles`,
				level: "info",
			});
		};

		run();
	}, [status]);

	return { articles, loading, loadingStatus, progress };
}
