import { useCallback, useEffect, useRef, useState } from "react";
import { loadAnalyzedArticles, loadFederatedArticles, loadLocalArticles } from "@/lib/articles";
import { addDebugLog } from "@/lib/log";
import { fetchArticlesBySources, getAvailableSources } from "@/lib/sources";
import {
	type Article,
	type ArticleAnalyzed,
	type ArticleFederated,
	createEmptyNodeStatus,
	type Source,
} from "@/types";

type ArticleTypeFilter = "all" | "local" | "analyzed" | "federated";

interface UseArticleLoaderOptions {
	/** Filter which type of articles to load */
	typeFilter?: ArticleTypeFilter;
	/** Whether to fetch external sources before loading local articles */
	fetchSources?: boolean;
	/** Current node status */
}

interface UseArticleLoaderReturn {
	articles: (Article | ArticleAnalyzed | ArticleFederated)[];
	loading: boolean;
	loadingStatus: string;
	progress: number;
	/** Function to manually reload all articles */
	reload: () => Promise<void>;
}

/**
 * React hook for loading local, analyzed, and federated articles.
 *
 * - Loads articles once on mount.
 * - Optionally fetches external sources first.
 * - Exposes `reload()` to manually refresh articles.
 * - Tracks loading state, status messages, and progress.
 *
 * @param options Hook options
 * @returns Object containing articles, loading state, progress, and reload function
 */
export function useArticleLoader(options: UseArticleLoaderOptions = {}): UseArticleLoaderReturn {
	const { typeFilter = "all", fetchSources = true } = options;

	const [articles, setArticles] = useState<(Article | ArticleAnalyzed | ArticleFederated)[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingStatus, setLoadingStatus] = useState("Starting up…");
	const [progress, setProgress] = useState(5);

	const fetchOnceRef = useRef(false);

	/**
	 * Load all articles from local, analyzed, and federated sources.
	 *
	 * - Fetches external sources if enabled.
	 * - Combines all loaded articles into a single array.
	 * - Updates loading/progress state.
	 */
	const loadArticles = useCallback(async () => {
		setLoading(true);
		setLoadingStatus("Initializing article loader…");
		setProgress(15);

		// Fetch external sources first
		if (fetchSources && (typeFilter === "all" || typeFilter === "local")) {
			setLoadingStatus("Loading news sources…");
			setProgress(20);

			try {
				const sources: Source[] = await getAvailableSources();
				if (sources.length > 0) {
					setLoadingStatus("Fetching articles from sources…");
					setProgress(40);
					for (const src of sources) {
						try {
							await fetchArticlesBySources([src]);
						} catch (err) {
							console.error("Failed fetching source:", src, err);
						}
					}
				}
			} catch (err) {
				console.error("Failed to get sources:", err);
			}
		}

		setLoadingStatus("Loading local articles…");
		setProgress(50);

		let local: Article[] = [];
		if (typeFilter === "all" || typeFilter === "local") {
			try {
				local = await loadLocalArticles();
			} catch (err) {
				console.error("Error loading local articles:", err);
			}
		}

		let analyzed: ArticleAnalyzed[] = [];
		if (typeFilter === "all" || typeFilter === "analyzed") {
			try {
				analyzed = await loadAnalyzedArticles();
			} catch {}
		}

		let federated: ArticleFederated[] = [];
		if (typeFilter === "all" || typeFilter === "federated") {
			try {
				federated = await loadFederatedArticles();
			} catch {}
		}

		const combined = [...local, ...analyzed, ...federated];
		setArticles(combined);
		setProgress(100);
		setLoading(false);

		await addDebugLog({
			message: `Loaded ${combined.length} articles (local: ${local.length}, analyzed: ${analyzed.length}, federated: ${federated.length})`,
			level: "info",
		});
	}, [typeFilter, fetchSources]);

	// Load articles once on mount
	useEffect(() => {
		if (!fetchOnceRef.current) {
			fetchOnceRef.current = true;
			loadArticles();
		}
	}, [loadArticles]);

	return { articles, loading, loadingStatus, progress, reload: loadArticles };
}
