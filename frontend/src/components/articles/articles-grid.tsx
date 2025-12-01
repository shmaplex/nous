/**
 * @file articles-grid.tsx
 * @description
 * Production-ready grid component that displays three article types:
 *   - Local Articles (raw ingested news)
 *   - Analyzed Articles (AI-enriched with bias/sentiment/cognitive bias metadata)
 *   - Federated Articles (distributed pointers via P2P/IPFS)
 *
 * Designed with a modern Perplexity-style aesthetic:
 * clean spacing, 2×2 desktop grid, subtle hover interactions,
 * and future-friendly placeholders for new UX features.
 */

import type React from "react";
import type { Article, ArticleAnalyzed, FederatedArticlePointer, ViewMode } from "@/types";

import ArticleAnalyzedCard from "./article-card-analyzed";
import ArticleFederatedCard from "./article-card-federated";
import ArticleLocalCard from "./article-card-local";

/**
 * Props for ArticlesGrid
 */
export interface ArticlesGridProps {
	/**
	 * A merged list of articles coming from:
	 *  - Local DB (`Article`)
	 *  - Analyzed DB (`ArticleAnalyzed`)
	 *  - Federated DB (`FederatedArticlePointer`)
	 *
	 * Rendering is determined automatically by structural keys.
	 */
	articles: (Article | ArticleAnalyzed | FederatedArticlePointer)[];

	/**
	 * Mode controls behavior of the grid.
	 * - `workbench`: show raw articles with analyze actions
	 * - `reading`: display analyzed/federated articles only
	 */
	mode?: ViewMode;

	/**
	 * Optional callback to archive a local/analyzed article.
	 */
	onArchive?: (id: string) => void;

	/**
	 * Optional callback to analyze a raw local article.
	 * Only used in `workbench` mode. If omitted, analyze buttons are hidden.
	 */
	onAnalyze?: (article: Article) => void;

	/**
	 * Optional callback to translate a raw local article title.
	 * Only used in `workbench` mode. If omitted, translate buttons are hidden.
	 */
	onTranslate?: (article: Article) => Promise<void>;

	/**
	 * Optional callback to open a full article view (modal or page)
	 * Receives the clicked article object.
	 */
	onOpen?: (article: Article) => void;
}

/**
 * ArticlesGrid Component
 *
 * Renders a modern Perplexity-inspired article grid with:
 *  - Automatic type detection
 *  - 2×2 max layout for readability
 *  - Smooth spacing & airy layout
 *  - Optional analyze, archive, translate, and open actions depending on mode
 */
const ArticlesGrid: React.FC<ArticlesGridProps> = ({
	articles,
	mode = "reading",
	onArchive,
	onAnalyze,
	onTranslate,
	onOpen,
}) => {
	/* ------------------------------
	 * Empty State
	 * ------------------------------ */
	if (!articles.length) {
		return (
			<div className="text-center py-16 text-muted-foreground">
				<h2 className="text-2xl font-semibold mb-2">No articles yet</h2>
				<p className="text-sm max-w-md mx-auto">
					Articles will appear once fetched from your enabled sources.
				</p>
			</div>
		);
	}

	/* ------------------------------
	 * Render Grid
	 * ------------------------------ */
	return (
		<div className="space-y-10">
			{/* Intro section */}
			<div className="px-4 sm:px-0">
				<h2 className="text-xl font-semibold mb-2">Your News Feed</h2>
			</div>

			{/* Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
				{articles.map((article) => {
					// Analyzed → has cognitiveBiases
					if ("cognitiveBiases" in article) {
						return (
							<ArticleAnalyzedCard
								key={article.id}
								article={article}
								onArchive={onArchive}
								// onOpen={onOpen} // optional full article view
							/>
						);
					}

					// Federated → has cid
					if ("cid" in article) {
						return (
							<ArticleFederatedCard
								key={article.cid}
								article={article}
								// onOpen={onOpen} // optional full article view
							/>
						);
					}

					// Local raw article — show analyze and translate buttons only in workbench
					return (
						<ArticleLocalCard
							key={article.id}
							article={article as Article}
							onArchive={onArchive}
							onAnalyze={mode === "workbench" ? onAnalyze : undefined}
							onTranslate={mode === "workbench" ? onTranslate : undefined}
							onOpen={onOpen}
						/>
					);
				})}
			</div>
		</div>
	);
};

export default ArticlesGrid;
