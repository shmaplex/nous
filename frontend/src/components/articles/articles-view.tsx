import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type {
	ArticleAnalyzed,
	ArticleStored,
	FederatedArticlePointer,
	FilterOptions,
} from "../../types";
import CoverageDetails from "../coverage-details";
import InsightsPanel from "../insights-panel";
import NewsCluster from "../news-cluster";
import Factuality from "./factuality";
import Ownership from "./ownership";
import PerspectiveBullets from "./perspective-bullets";
import SimilarNewsTopics from "./similar-news-topics";

interface Props {
	articles: ArticleStored[];
	federatedArticles: FederatedArticlePointer[];
	analyzedArticles: ArticleAnalyzed[];
	filter: FilterOptions;
	location: string;
}

const ArticlesView: React.FC<Props> = ({
	articles,
	federatedArticles,
	analyzedArticles,
	filter,
	location,
}) => {
	const [tab, setTab] = useState<"unanalyzed" | "federated" | "analyzed">("analyzed");

	const renderTabContent = () => {
		switch (tab) {
			case "unanalyzed":
				return (
					<ul className="space-y-2">
						{articles.map((a) => (
							<li key={a.id} className="border p-2 rounded">
								{a.title} ({a.sourceType})
							</li>
						))}
					</ul>
				);
			case "federated":
				return (
					<ul className="space-y-2">
						{federatedArticles.map((f) => (
							<li key={f.cid} className="border p-2 rounded">
								{f.source ?? "Federated"} - {f.cid.slice(0, 8)}...
							</li>
						))}
					</ul>
				);
			case "analyzed":
				return (
					<ul className="space-y-2">
						{analyzedArticles.map((a) => (
							<li key={a.id} className="border p-2 rounded">
								{a.title} - {a.politicalBias ?? "neutral"} - {a.source}
							</li>
						))}
					</ul>
				);
		}
	};

	return (
		<div className="space-y-6">
			{/* Tab Selector */}
			<div className="flex gap-2 mb-4">
				{["unanalyzed", "federated", "analyzed"].map((t) => (
					<Button
						key={t}
						variant={tab === t ? "default" : "outline"}
						size="sm"
						onClick={() => setTab(t as typeof tab)}
					>
						{t.charAt(0).toUpperCase() + t.slice(1)}
					</Button>
				))}
			</div>

			{/* Insights */}
			<InsightsPanel
				articles={articles}
				analyzedArticles={analyzedArticles}
				federatedArticles={federatedArticles}
			/>

			{/* Articles Table / List */}
			<div className="bg-white dark:bg-gray-900 p-4 rounded-md border border-border">
				{renderTabContent()}
			</div>

			{/* Detailed Analysis / Metrics */}
			<div className="grid grid-cols-1 tablet:grid-cols-2 gap-6">
				<PerspectiveBullets
					leftPoints={["Left insight 1", "Left insight 2"]}
					centerPoints={["Center insight 1"]}
					rightPoints={["Right insight 1"]}
					biasComparisonPoints={["Bias comparison 1", "Bias comparison 2"]}
				/>

				<div className="flex flex-col gap-6">
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
				</div>
			</div>

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
	);
};

export default ArticlesView;
