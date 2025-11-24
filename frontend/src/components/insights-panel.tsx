import type React from "react";
import type { ArticleAnalyzed, ArticleStored, FederatedArticlePointer } from "../types";

interface Props {
	articles: ArticleStored[];
	analyzedArticles: ArticleAnalyzed[];
	federatedArticles: FederatedArticlePointer[];
}

const InsightsPanel: React.FC<Props> = ({ articles, analyzedArticles, federatedArticles }) => {
	// TODO: implement analytics
	return (
		<div className="space-y-4 p-4 border rounded shadow bg-gray-50">
			<h2 className="font-bold text-lg mb-2">Insights & Analytics</h2>

			<div className="grid grid-cols-1 gap-2">
				<div>Total Articles: {articles.length}</div>
				<div>Federated Articles: {federatedArticles.length}</div>
				<div>Analyzed Articles: {analyzedArticles.length}</div>

				{/* Placeholder for popular articles, coverage count, daily/weekly/monthly trends */}
				<div>Top Sources: TBD</div>
				<div>Daily Trending: TBD</div>
				<div>Weekly Most Covered: TBD</div>
				<div>Monthly Insights: TBD</div>
			</div>
		</div>
	);
};

export default InsightsPanel;
