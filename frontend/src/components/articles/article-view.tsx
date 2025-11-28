/**
 * @file article-view.tsx
 * @description
 * Full article display component for the Nous Desktop Client.
 *
 * Responsibilities:
 *  - Show a single local article in a clean, readable left column
 *  - Sticky right-hand insights panel
 *  - Detailed metrics including ownership, factuality, and coverage
 *  - Related/similar news clusters
 *  - Optional back button for returning from full article view
 *  - Placeholder for loading or empty content
 */

import type React from "react";
import Factuality from "@/components/articles/factuality";
import Ownership from "@/components/articles/ownership";
// import PerspectiveBullets from "@/components/articles/perspective-bullets";
import SimilarNewsTopics from "@/components/articles/similar-news-topics";
import CoverageDetails from "@/components/coverage-details";
import InsightsPanel from "@/components/insights-panel";
import NewsCluster from "@/components/news-cluster";
import { Button } from "@/components/ui/button";
import type { Article } from "@/types";

interface Props {
	/** The main article to display */
	article?: Article;

	/** Current location context (international vs local edition, etc.) */
	location: string;

	/** Optional callback to handle the "Back" button */
	onBack?: () => void;
}

const ArticleView: React.FC<Props> = ({ article, location, onBack }) => {
	return (
		<div className="relative w-full flex flex-col lg:flex-row gap-6">
			{/* Left Column: Article content */}
			<div className="flex-1 w-full">
				{/* Loading / Placeholder */}
				{!article && (
					<div className="text-center py-10 text-muted-foreground">
						<p className="text-lg animate-pulse">Processing full article... please wait 🚀</p>
					</div>
				)}

				{/* Back Button */}
				{onBack && (
					<div className="mb-4">
						<Button variant="ghost" onClick={onBack}>
							← Back
						</Button>
					</div>
				)}

				{/* Article Content */}
				{article && (
					<div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-border shadow-sm space-y-6">
						{/* Source & Date */}
						<p className="text-sm text-muted-foreground">
							{article.source ?? article.sourceDomain ?? "Unknown source"} -{" "}
							{article.publishedAt
								? new Date(article.publishedAt).toLocaleDateString()
								: "Unknown date"}
						</p>

						{/* Article Title */}
						<h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
							{article.title}
						</h1>

						{/* Summary or Content */}
						<p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
							{article.summary ?? article.content ?? "No content available."}
						</p>

						{/* Perspective Bullets Section */}
						{/* TODO: Uncomment when analysis is available */}
						{/*
						<div className="mt-8">
							<h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
								Perspectives & Bias Insights
							</h2>
							<PerspectiveBullets
								leftPoints={["Left insight 1", "Left insight 2"]}
								centerPoints={["Center insight 1"]}
								rightPoints={["Right insight 1"]}
								biasComparisonPoints={["Bias comparison 1", "Bias comparison 2"]}
							/>
						</div>
						*/}
					</div>
				)}
			</div>

			{/* Right Column: Sticky Insights Panel */}
			<div className="hidden lg:block w-80 shrink-0">
				<div className="sticky top-16 space-y-6">
					<InsightsPanel />

					<Ownership
						primary="independent"
						distribution={{ independent: 40, mediaConglomerate: 20, telecom: 20, other: 20 }}
					/>
					<Factuality
						accuracyPercent={85}
						distribution={{ low: 10, medium: 5, high: 85 }}
						methodologyNote="Calculated using cross-source verification and historical reliability"
					/>

					<CoverageDetails
						totalSources={21}
						left={10}
						right={3}
						center={8}
						biasDistribution="48% Left, 20% Center, 32% Right"
					/>

					{/* Related / Similar News */}
					<SimilarNewsTopics />

					<NewsCluster
						title="Highlighted Sources Map"
						sources={[
							{ id: "1", href: "#", img: "/logo1.png", alt: "KR" },
							{ id: "2", href: "#", img: "/logo2.png", alt: "US" },
						]}
					/>
				</div>
			</div>
		</div>
	);
};

export default ArticleView;
