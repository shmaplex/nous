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

import { BookOpen, Brain, ExternalLink, Info, Split } from "lucide-react";
import type React from "react";
import Factuality from "@/components/articles/factuality";
import Ownership from "@/components/articles/ownership";
import SimilarNewsTopics from "@/components/articles/similar-news-topics";
import CoverageDetails from "@/components/coverage-details";
import InsightsPanel from "@/components/insights-panel";
import NewsCluster from "@/components/news-cluster";
import SentimentMeter from "@/components/sentiment-meter";
import { Button } from "@/components/ui/button";
import { getRelativeTime } from "@/lib/time";
import type { ArticleAnalyzed } from "@/types";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import BiasBar from "../bias-bar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface Props {
	/** The main article to display */
	article?: ArticleAnalyzed;

	/** Current location context (international vs local edition, etc.) */
	location: string;

	/** Optional callback to handle the "Back" button */
	onBack?: () => void;

	/** Whether the article is still being processed */
	loading?: boolean;
}

/**
 * ArticleView
 *
 * Displays a full article along with any analyzed insights, metadata, and related content.
 *
 * @param {Props} props
 * @returns {JSX.Element} The article view component
 */
const ArticleView: React.FC<Props> = ({ article, location, onBack, loading = false }) => {
	const isLoading = loading || !article;

	return (
		<div className="relative w-full flex flex-col lg:flex-row gap-8">
			{/* Left Column: Article */}
			<div className="flex-1 w-full space-y-2">
				{/* Back Button */}
				{onBack && (
					<div>
						<Button
							variant="ghost"
							onClick={onBack}
							className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
						>
							← Back
						</Button>
					</div>
				)}

				{/* Article Content */}
				{article && (
					<article className="bg-card dark:bg-gray-900 rounded-xl shadow-lg border border-border/50 overflow-hidden">
						{article.politicalBias && <BiasBar bias={article.politicalBias ?? "unknown"} />}
						{/* Article Image */}
						{article.image && (
							<div className="w-full h-64 sm:h-80 md:h-96 overflow-hidden rounded-t-xl">
								<img
									src={article.image}
									alt={article.title}
									className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
								/>
							</div>
						)}

						<div className="p-6 space-y-6">
							{/* Metadata */}
							<div className="flex items-center justify-between w-full">
								<div className="text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1 dark:text-gray-400">
									<span>{article.source ?? article.sourceDomain ?? "Unknown source"}</span>
									{article.author && (
										<span className="before:content-['•'] before:mx-2">{article.author}</span>
									)}
									{article.publishedAt && (
										<span className="before:content-['•'] before:mx-2">
											Published {getRelativeTime(article.publishedAt)}
										</span>
									)}
									{article.fetchedAt && (
										<span className="before:content-['•'] before:mx-2">
											Fetched {getRelativeTime(article.fetchedAt)}
										</span>
									)}
								</div>

								{article?.url && (
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											size="sm"
											className="flex items-center gap-1"
											onClick={() => BrowserOpenURL(article.url)}
										>
											<ExternalLink className="w-4 h-4" />
											Open Original
										</Button>
									</div>
								)}
							</div>

							{/* Categories */}
							{article?.categories && Array(article.categories)?.length && (
								<div className="flex flex-wrap gap-2">
									{article.categories.map((cat) => (
										<span
											key={cat}
											className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium"
										>
											{cat}
										</span>
									))}
								</div>
							)}

							{/* Article Title */}
							<h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-foreground dark:text-gray-100">
								{article.title}
							</h1>

							{/* Summary / Content */}
							<p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
								{article.summary?.trim() || article.content?.trim() || "No content available."}
							</p>

							{/* Tags */}
							<div className="flex flex-wrap gap-2">
								{article.tags?.length ? (
									article.tags.map((tag) => (
										<span
											key={tag}
											className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
										>
											{tag}
										</span>
									))
								) : (
									<span className="px-2 py-1 rounded text-sm italic text-gray-400 dark:text-gray-500">
										No tags available
									</span>
								)}
							</div>

							{/* Analysis & Insights */}
							{article?.analyzed && (
								<section className="mt-10">
									<div className="flex items-center gap-2 mb-4">
										<h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
											Analysis & Insights
										</h2>

										{/* Section info tooltip */}
										<Tooltip>
											<TooltipTrigger>
												<Info className="w-5 h-5 text-muted-foreground cursor-pointer" />
											</TooltipTrigger>
											<TooltipContent className="max-w-xs bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded shadow-lg">
												This section contains AI-powered analysis including sentiment, cognitive
												bias detection, rhetorical framing, and philosophical angles.
											</TooltipContent>
										</Tooltip>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										{/* SENTIMENT METER */}
										<div className="p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
											<SentimentMeter
												sentiment={article.sentiment}
												sentimentValence={article.sentimentValence}
											/>
										</div>

										{/* PHILOSOPHICAL FRAMING */}
										{article.philosophical && (
											<div className="p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
												<div className="flex items-center justify-between mb-2">
													<h3 className="text-lg font-semibold">Philosophical Framing</h3>
													<Tooltip>
														<TooltipTrigger>
															<BookOpen className="h-5 w-5 text-muted-foreground cursor-pointer" />
														</TooltipTrigger>
														<TooltipContent className="max-w-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded shadow-lg">
															Conceptual lens or philosophical tradition the article implicitly
															aligns with.
														</TooltipContent>
													</Tooltip>
												</div>

												<p className="text-sm text-muted-foreground leading-relaxed">
													{article.philosophical || "No philosophical framing detected."}
												</p>
											</div>
										)}

										{/* ANTITHESIS */}
										{article.antithesis && (
											<div className="p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow md:col-span-2">
												<div className="flex items-center justify-between mb-2">
													<h3 className="text-lg font-semibold">Antithesis</h3>
													<Tooltip>
														<TooltipTrigger>
															<Split className="h-5 w-5 text-muted-foreground cursor-pointer" />
														</TooltipTrigger>
														<TooltipContent className="max-w-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded shadow-lg">
															Alternative viewpoint or opposing argument derived from dialectical
															analysis.
														</TooltipContent>
													</Tooltip>
												</div>

												<p className="text-sm text-muted-foreground leading-relaxed">
													{article.antithesis || "No antithesis detected."}
												</p>
											</div>
										)}

										{/* COGNITIVE BIASES */}
										{article.cognitiveBiases && article.cognitiveBiases?.length > 0 && (
											<div className="p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow md:col-span-2">
												<div className="flex items-center justify-between mb-3">
													<h3 className="text-lg font-semibold">Cognitive Biases Detected</h3>
													<Tooltip>
														<TooltipTrigger>
															<Brain className="h-5 w-5 text-muted-foreground cursor-pointer" />
														</TooltipTrigger>
														<TooltipContent className="max-w-xs bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded shadow-lg">
															Patterns in the text showing psychological biases in reasoning or
															persuasion.
														</TooltipContent>
													</Tooltip>
												</div>

												<div className="space-y-4">
													{article.cognitiveBiases.map((bias) => (
														<div key={bias.bias} className="border-t pt-3">
															<p className="text-sm font-medium mb-1">{bias.bias}</p>
															<details className="group cursor-pointer">
																<summary className="text-sm text-muted-foreground group-open:text-foreground group-hover:text-foreground transition-colors">
																	View snippet
																</summary>
																<p className="mt-2 text-sm text-muted-foreground border-l-2 pl-3">
																	{bias.snippet}
																</p>
															</details>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								</section>
							)}
						</div>
					</article>
				)}

				{/* Loading / Placeholder */}
				{isLoading && (
					<div className="text-center py-20 animate-pulse text-muted-foreground">
						<p className="text-lg sm:text-xl">Processing full article... please wait 🚀</p>
					</div>
				)}
			</div>

			{/* Right Column: Sticky Insights */}
			<aside className="hidden lg:block w-96 shrink-0">
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

					<SimilarNewsTopics />

					<NewsCluster
						title="Highlighted Sources Map"
						sources={[
							{ id: "1", href: "#", img: "/logo1.png", alt: "KR" },
							{ id: "2", href: "#", img: "/logo2.png", alt: "US" },
						]}
					/>
				</div>
			</aside>
		</div>
	);
};

export default ArticleView;
