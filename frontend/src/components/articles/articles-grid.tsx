// frontend/src/components/articles/articles-grid.tsx
import type React from "react";
import type { Article, ArticleAnalyzed, FederatedArticlePointer } from "../../types";
import ArticleAnalyzedCard from "./article-card-analyzed";
import ArticleFederatedCard from "./article-card-federated";
import ArticleLocalCard from "./article-card-local";

interface ArticlesGridProps {
	articles: (Article | ArticleAnalyzed | FederatedArticlePointer)[];
	onArchive?: (id: string) => void;
}

/**
 * Articles Grid
 *
 * - Displays all articles in an optimized responsive grid
 * - Highlights analyzed AI content, federated sources, and local articles
 * - Provides section cues for new users to understand app functionality
 */
const ArticlesGrid: React.FC<ArticlesGridProps> = ({ articles, onArchive }) => {
	if (!articles.length) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				<h2 className="text-2xl font-semibold mb-2">No articles available</h2>
				<p className="text-sm max-w-md mx-auto">
					Articles will appear here once processed. The platform ingests news from multiple sources,
					analyzes bias, sentiment, and cognitive distortions, and federates content across
					networks.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Optional: Section intro for new users */}
			<div className="px-4 sm:px-0">
				<h2 className="text-xl font-bold mb-2">Your News Overview</h2>
				<p className="text-sm text-muted-foreground max-w-2xl">
					The platform categorizes articles into three types:
					<ul className="list-disc ml-5 mt-1">
						<li>
							<b>Local Articles:</b> Directly ingested content from familiar sources.
						</li>
						<li>
							<b>Analyzed Articles:</b> AI-enriched articles with political bias, sentiment, and
							detected cognitive biases.
						</li>
						<li>
							<b>Federated Articles:</b> Content pulled from distributed sources (IPFS or federated
							feeds).
						</li>
					</ul>
				</p>
			</div>

			{/* Responsive Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{articles.map((article) => {
					// Decide which card to render based on type
					if ("cognitiveBiases" in article) {
						return (
							<ArticleAnalyzedCard
								key={article.id ?? Math.random().toString(36).slice(2, 11)}
								article={article as ArticleAnalyzed}
								onArchive={onArchive}
							/>
						);
					}
					if ("cid" in article) {
						return (
							<ArticleFederatedCard
								key={article.cid ?? Math.random().toString(36).slice(2, 11)}
								article={article as FederatedArticlePointer}
							/>
						);
					}
					return (
						<ArticleLocalCard
							key={article.id ?? Math.random().toString(36).slice(2, 11)}
							article={article as Article}
							onArchive={onArchive}
						/>
					);
				})}
			</div>

			{/* Optional: Footer explanation */}
			<div className="px-4 sm:px-0 text-sm text-muted-foreground text-center max-w-2xl mx-auto mt-4">
				<p>
					Articles are dynamically sorted and displayed for maximum clarity. Hover over a card to
					see more details, including detected biases, antithesis, and AI interpretations.
				</p>
			</div>
		</div>
	);
};

export default ArticlesGrid;
