import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import ArticlesGrid from "@/components/articles/articles-grid";
import FiltersPanel from "@/components/filters-panel";
import { LoadingOverlay } from "@/components/loading/loading-overlay";
import { useArticleLoader } from "@/hooks/useArticleLoader";
import { useNodeStatus } from "@/hooks/useNodeStatus";
import type { ApiResponse, Article, FilterOptions } from "@/types";
import { TranslateArticle } from "../../../wailsjs/go/main/App";
import { Button } from "../ui/button";

interface Props {
	/** Callback when an article should be analyzed */
	onAnalyzeArticle: (article: Article) => void;
	/** Callback when an article title is translated */
	onTranslated: (id: Article["id"], title: string, success: boolean) => void;
	/** Optional callback when an article card is opened */
	onOpen?: (article: Article) => void;
	/** Optional callback to inform parent component of loading state */
	onLoadingChange?: (isLoading: boolean, statusMessage?: string, progress?: number) => void;
	/** Current filters applied in this view */
	filter: FilterOptions;
	/** Function to update filters */
	setFilter: (filter: FilterOptions) => void;
}

/**
 * WorkbenchView Component
 *
 * Displays a grid of articles from local, analyzed, and federated sources.
 * Includes filters, reload button, and loading overlay.
 *
 * @param props - Component props
 */
const WorkbenchView: React.FC<Props> = ({
	onAnalyzeArticle,
	onTranslated,
	onOpen,
	onLoadingChange,
	filter,
	setFilter,
}) => {
	const { status, appLoaded } = useNodeStatus();
	const {
		articles: loadedArticles,
		loading: articleLoading,
		loadingStatus,
		progress,
		reload,
	} = useArticleLoader();

	const [loading, setLoading] = useState(true);
	const [articles, setArticles] = useState(loadedArticles);
	const [reloading, setReloading] = useState(false);

	/**
	 * Trigger initial load when node is ready
	 */
	useEffect(() => {
		if (!appLoaded || !status.running) return;
		let cancelled = false;

		const load = async () => {
			setLoading(true);
			setReloading(true);
			await reload();
			if (!cancelled) setReloading(false);
			setLoading(false);
		};
		load();

		return () => {
			cancelled = true;
		};
	}, [appLoaded, status.running, reload]);

	/**
	 * Sync local articles state with loader
	 */
	useEffect(() => {
		const loadedIds = loadedArticles
			.map((a) => a.id)
			.sort()
			.join(",");
		const currentIds = articles
			.map((a) => a.id)
			.sort()
			.join(",");
		if (loadedIds !== currentIds) {
			setArticles(loadedArticles);
		}
	}, [loadedArticles, articles]);

	/**
	 * Inform parent component of loading state
	 */
	useEffect(() => {
		onLoadingChange?.(loading, loadingStatus, progress);
	}, [loading, loadingStatus, progress, onLoadingChange]);

	/**
	 * Translate a single article title
	 *
	 * @param article - The article to translate
	 */
	const handleTranslate = async (article: Article) => {
		if (!article.id) return;

		try {
			const resStr = await TranslateArticle([article.id], "en", ["title"], true);
			const res: ApiResponse<Article[]> = JSON.parse(resStr);

			if (res.success && Array.isArray(res.data)) {
				const firstResult = res.data[0];
				if (firstResult.title) {
					onTranslated?.(article.id, firstResult.title, true);
					setArticles((prev) =>
						prev.map((a) => (a.id === article.id ? { ...a, title: firstResult.title } : a)),
					);
				} else {
					onTranslated?.(article.id, article.title, false);
				}
			} else {
				onTranslated?.(article.id, article.title, false);
			}
		} catch (err) {
			console.error("Translation error:", err);
			onTranslated?.(article.id, article.title, false);
		}
	};

	/**
	 * Handle click on article card
	 *
	 * @param article - The article clicked
	 */
	const handleOpenArticle = (article: Article) => onOpen?.(article);

	/**
	 * Handle relaoding the articles
	 */
	const handleReload = () => {
		setReloading(true);
		reload().finally(() => setReloading(false));
	};

	return (
		<div className="flex flex-col gap-6">
			<LoadingOverlay open={loading || articleLoading} status={loadingStatus} progress={progress} />

			<div className="sticky top-18 z-20 bg-background flex items-center justify-between py-2">
				<FiltersPanel filter={filter} setFilter={setFilter} />
			</div>

			<header className="p-3 sm:p-6 border rounded-xl text-foreground/50 border-border/50 flex space-x-4">
				<h1 className="text-xl font-semibold tracking-tight mb-2">Workbench</h1>
				<p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
					Raw news articles fetched from your selected sources. Analyze them to generate AI-enriched
					insights and publish into the distributed knowledge graph.
				</p>
			</header>

			<ArticlesGrid
				reloading={reloading}
				articles={articles}
				onAnalyze={onAnalyzeArticle}
				onTranslate={handleTranslate}
				onOpen={handleOpenArticle}
				onReload={handleReload}
				mode="workbench"
			/>
		</div>
	);
};

export default WorkbenchView;
