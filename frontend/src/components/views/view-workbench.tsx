import { useEffect, useState } from "react";
import ArticlesGrid from "@/components/articles/articles-grid";
import FiltersPanel from "@/components/filters-panel";
import { LoadingOverlay } from "@/components/loading/loading-overlay";
import { useArticleLoader } from "@/hooks/useArticleLoader";
import type { ApiResponse, Article, FilterOptions } from "@/types";
import { TranslateArticle } from "../../../wailsjs/go/main/App";

interface Props {
	onAnalyzeArticle: (article: Article) => void;
	onTranslated: (id: Article["id"], title: string, success: boolean) => void;
	onOpen?: (article: Article) => void;
	onLoadingChange?: (isLoading: boolean, statusMessage?: string, progress?: number) => void;
	filter: FilterOptions;
	setFilter: (filter: FilterOptions) => void;
}

/**
 * WorkbenchView Component
 */
const WorkbenchView: React.FC<Props> = ({
	onAnalyzeArticle,
	onTranslated,
	onOpen,
	onLoadingChange,
	filter,
	setFilter,
}) => {
	const { articles: loadedArticles, loading, loadingStatus, progress } = useArticleLoader();

	// Local state for articles to allow updates (translate)
	const [articles, setArticles] = useState(loadedArticles);

	/** Update state when loader fetches new articles */
	useEffect(() => {
		setArticles(loadedArticles);
	}, [loadedArticles]);

	useEffect(() => {
		onLoadingChange?.(loading, loadingStatus, progress);
	}, [loading, loadingStatus, progress, onLoadingChange]);

	/** Handle translation of a single article title */
	const handleTranslate = async (article: Article) => {
		try {
			if (!article.id) {
				console.warn("Skipping translation: article.id missing", article);
				return;
			}

			const resStr = await TranslateArticle([article.id], "en", ["title"], true);

			const res: ApiResponse<Article[]> = JSON.parse(resStr);
			console.log("res", res);

			if (res.success && Array.isArray(res.data)) {
				const firstResult = res.data[0];

				if (res.success && firstResult.title) {
					console.log("translatedTitle", firstResult.title);
					if (onTranslated) onTranslated(article.id, firstResult.title, true);
					setArticles((prev) =>
						prev.map((a) =>
							a.id === article.id ? { ...a, title: firstResult.title ?? a.title } : a,
						),
					);
				} else {
					console.warn(`Translation failed for ${article.id}:`, res.error);
					if (onTranslated) onTranslated(article.id, article.title, false);
				}
			} else {
				console.warn("Translation API call failed:", res.error);
				if (onTranslated) onTranslated(article.id, article.title, false);
			}
		} catch (err) {
			console.error("Translation error:", err);
			if (onTranslated) onTranslated(article.id, article.title, false);
		}
	};

	/** Handle click on article card */
	const handleArticleClick = (article: Article) => {
		if (onOpen) onOpen(article);
	};

	return (
		<div className="flex flex-col gap-10">
			<LoadingOverlay open={loading} status={loadingStatus} progress={progress} />
			<div className="sticky top-14 z-20 bg-background px-6 py-3 border-b shadow-sm border-border">
				<FiltersPanel filter={filter} setFilter={setFilter} />
			</div>

			<header className="px-4 sm:px-0">
				<h1 className="text-2xl font-semibold tracking-tight mb-2">Workbench</h1>
				<p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
					Raw news articles fetched from your selected sources. Analyze them to generate AI-enriched
					insights and publish into the distributed knowledge graph.
				</p>
			</header>

			<ArticlesGrid
				articles={articles}
				onAnalyze={onAnalyzeArticle}
				onTranslate={handleTranslate}
				onOpen={handleArticleClick}
				mode="workbench"
			/>
		</div>
	);
};

export default WorkbenchView;
