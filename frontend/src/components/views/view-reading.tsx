/**
 * @file view-reading.tsx
 * @description
 * Reading Mode — a calm, distraction-free view for fully analyzed articles.
 * Each view can have its own filters.
 */

import React, { useEffect, useState } from "react";
import type { ArticleAnalyzed, FilterOptions } from "@/types";
import ArticlesGrid from "@/components/articles/articles-grid";
import { LoadingOverlay } from "@/components/loading/loading-overlay";
import FiltersPanel from "../filters-panel";

// Wails bridge
import { FetchAnalyzedArticles } from "@/../wailsjs/go/main/App";

interface Props {
  /**
   * Optional callback to notify parent about loading state changes.
   */
  onLoadingChange?: (isLoading: boolean, statusMessage?: string, progress?: number) => void;

  /**
   * Filters specific to this view
   */
  filter: FilterOptions;

  /**
   * Callback to update filters for this view
   */
  setFilter: (filter: FilterOptions) => void;
}

/**
 * ReadingView Component
 *
 * Minimalist layout for browsing AI-analyzed news content.
 * Loads articles via Wails → Go → backend.
 */
const ReadingView: React.FC<Props> = ({ onLoadingChange, filter, setFilter }) => {
  const [analyzed, setAnalyzed] = useState<ArticleAnalyzed[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("Loading analyzed articles…");
  const [progress, setProgress] = useState(20);

  useEffect(() => {
    const run = async () => {
      try {
        setLoadingStatus("Fetching analyzed articles…");
        setProgress(40);
        onLoadingChange?.(true, "Fetching analyzed articles…", 40);

        const res = await FetchAnalyzedArticles();
        const parsed = JSON.parse(res);

        setAnalyzed(parsed || []);
        setProgress(100);
        onLoadingChange?.(false, "Loaded analyzed articles", 100);
      } catch (err) {
        console.error("Failed to load analyzed articles:", err);
        setLoadingStatus("Failed to load analyzed articles.");
        onLoadingChange?.(false, "Failed to load analyzed articles", 0);
      }
      setLoading(false);
    };

    run();
  }, [onLoadingChange]);

  return (
    <div className="flex flex-col gap-10">
      {/* Loading Overlay */}
      <LoadingOverlay open={loading} status={loadingStatus} progress={progress} />

      {/* Header */}
      <header className="px-4 sm:px-0">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Reading Mode</h1>
        <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
          A clean, focused space for reading your AI-analyzed news articles.
        </p>
      </header>

      {/* Filters Panel */}
      <div className="sticky top-14 z-20 py-3">
        <FiltersPanel filter={filter} setFilter={setFilter} />
      </div>

      {/* Article Grid */}
      <ArticlesGrid articles={analyzed} mode="reading" />
    </div>
  );
};

export default ReadingView;