/**
 * @file ArticlesGrid.tsx
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
import type { Article, ArticleAnalyzed, FederatedArticlePointer } from "../../types";

import ArticleAnalyzedCard from "./article-card-analyzed";
import ArticleFederatedCard from "./article-card-federated";
import ArticleLocalCard from "./article-card-local";

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
	 * Optional callback to archive a local/analyzed article.
	 */
	onArchive?: (id: string) => void;
}

/**
 * ArticlesGrid Component
 *
 * Renders a clean, modern, Perplexity-inspired article grid with:
 *  • Automatic type detection
 *  • 2×2 max layout for high readability
 *  • Smooth spacing & airy layout for younger UX preferences
 *  • Subtle animations & card polish
 */
const ArticlesGrid: React.FC<ArticlesGridProps> = ({ articles, onArchive }) => {
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
	 * Render Grid + Intro
	 * ------------------------------ */
	return (
		<div className="space-y-10">
			{/* Intro section */}
			<div className="px-4 sm:px-0">
				<h2 className="text-xl font-semibold mb-2">Your News Feed</h2>

				{/* <div className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
					<p>The feed includes several types of articles:</p>

					<ul className="list-disc ml-5 mt-2 space-y-1">
						<li>
							<b>Local Articles</b> — Directly ingested news content.
						</li>
						<li>
							<b>Analyzed Articles</b> — AI-enriched insights (sentiment, bias, cognition).
						</li>
						<li>
							<b>Federated Articles</b> — Distributed via P2P or orbit feeds.
						</li>
					</ul>
				</div> */}
			</div>

			{/* 2×2 Perplexity-style grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
				{articles.map((article) => {
					// Analyzed → has `cognitiveBiases`
					if ("cognitiveBiases" in article) {
						return <ArticleAnalyzedCard key={article.id} article={article} onArchive={onArchive} />;
					}

					// Federated → has `cid`
					if ("cid" in article) {
						return <ArticleFederatedCard key={article.cid} article={article} />;
					}

					// Local article
					return (
						<ArticleLocalCard key={article.id} article={article as Article} onArchive={onArchive} />
					);
				})}
			</div>
		</div>
	);
};

export default ArticlesGrid;
