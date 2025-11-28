/**
 * @file view-workbench.tsx
 * @description
 * Workbench Mode — an operational view for inspecting raw, un-analyzed articles
 * and triggering analysis actions.
 *
 * Features:
 *  - Article grid with local articles
 *  - Per-view filters panel
 *  - Optional "Analyze" button per article
 *  - Loading overlay for data fetches
 *  - Clickable articles via `onOpen` callback (full view handled by parent)
 */

import type React from "react";
import { useEffect } from "react";
import type { Article, FilterOptions } from "@/types";
import ArticlesGrid from "@/components/articles/articles-grid";
import { LoadingOverlay } from "@/components/loading/loading-overlay";
import FiltersPanel from "../filters-panel";
import { useArticleLoader } from "@/hooks/useArticleLoader";

interface Props {
  /**
   * Callback triggered whenever the user chooses to analyze an article.
   */
  onAnalyzeArticle: (article: Article) => void;

  /**
   * Callback triggered when a user clicks an article.
   * Parent handles opening full view.
   */
  onOpen?: (article: Article) => void;

  /**
   * Optional callback to notify parent about loading state changes.
   * Called with `(isLoading, statusMessage?, progress?)`.
   */
  onLoadingChange?: (isLoading: boolean, statusMessage?: string, progress?: number) => void;

  /**
   * Current filter state for this view
   */
  filter: FilterOptions;

  /**
   * Callback to update filter state
   */
  setFilter: (filter: FilterOptions) => void;
}

/**
 * WorkbenchView Component
 *
 * A modern, Perplexity-style workspace for interacting with raw news articles.
 *
 * Responsibilities:
 *  - Load and display local articles
 *  - Handle filtering via `FiltersPanel`
 *  - Allow analysis triggers via `onAnalyzeArticle`
 *  - Allow article clicks via `onOpen` callback
 *  - Communicate loading state to parent via `onLoadingChange`
 */
const WorkbenchView: React.FC<Props> = ({
  onAnalyzeArticle,
  onOpen,
  onLoadingChange,
  filter,
  setFilter,
}) => {
  /** -----------------------------
   * Local articles loader
   * ----------------------------- */
  const { articles, loading, loadingStatus, progress } = useArticleLoader();

  /** -----------------------------
   * Notify parent about loading
   * ----------------------------- */
  useEffect(() => {
    onLoadingChange?.(loading, loadingStatus, progress);
  }, [loading, loadingStatus, progress, onLoadingChange]);

  /**
   * Handle click on an article card.
   * Calls `onOpen` if provided by parent.
   *
   * @param article - The clicked article
   */
  const handleArticleClick = (article: Article) => {
    if (onOpen) {
      onOpen(article);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Loading overlay */}
      <LoadingOverlay open={loading} status={loadingStatus} progress={progress} />

      {/* Header */}
      <header className="px-4 sm:px-0">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Workbench</h1>
        <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
          Raw news articles fetched from your selected sources. Analyze them to generate AI-enriched insights and publish into the distributed knowledge graph.
        </p>
      </header>

      {/* Filters Panel */}
      <div className="sticky top-0 z-20 bg-background px-6 py-3 border-b shadow-sm border-border">
        <FiltersPanel filter={filter} setFilter={setFilter} />
      </div>

      {/* Articles Grid */}
      <ArticlesGrid
        articles={articles}
        onAnalyze={onAnalyzeArticle}
        onOpen={handleArticleClick}
        mode="workbench"
      />
    </div>
  );
};

export default WorkbenchView;