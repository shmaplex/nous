import {
	CalendarIcon,
	CheckCircleIcon,
	DatabaseIcon,
	GlobeIcon,
	InfoIcon,
	StarIcon,
	TrendingUpIcon,
} from "lucide-react";
import type React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
	totalArticles?: number;
	federatedArticles?: number;
	analyzedArticles?: number;
	topSources?: string;
	dailyTrending?: string;
	weeklyMostCovered?: string;
	monthlyInsights?: string;
}

/**
 * Displays client-friendly analytics and insights about the article dataset.
 *
 * Features:
 * - 2x2 grid layout with hanging items spanning full width
 * - Icons and tooltips for clarity
 * - Placeholder defaults for empty data
 * - Note when placeholder data is used
 */
const InsightsPanel: React.FC<Props> = ({
	totalArticles = 123,
	federatedArticles = 45,
	analyzedArticles = 78,
	topSources = "Example News, Sample Times",
	dailyTrending = "Some Trending Topic",
	weeklyMostCovered = "Topic A, Topic B",
	monthlyInsights = "Topic X highlights",
}) => {
	const isPlaceholder =
		totalArticles === 123 && federatedArticles === 45 && analyzedArticles === 78;

	return (
		<div className="space-y-5 p-4 border rounded-xl shadow bg-background/50 text-foreground text-sm">
			{/* Header */}
			<div className="flex items-center gap-2 mb-4">
				<h2 className="font-semibold text-lg">Insights & Analytics</h2>
				<Tooltip>
					<TooltipTrigger asChild>
						<InfoIcon className="w-4 h-4 text-muted-foreground cursor-pointer flex-none" />
					</TooltipTrigger>
					<TooltipContent side="top" className="text-xs">
						Overview of articles, analysis results, and federated (external) data.
					</TooltipContent>
				</Tooltip>
			</div>

			{/* 2x2 Grid */}

			<div className="w-full flex flex-col space-y-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-foreground/10 p-3 rounded-xl mb-4">
					<h4 className="uppercase text-xs text-foreground/40 m-0 leading-none col-span-2">
						Article Analytics
					</h4>
					{/* Total Articles */}
					<div className="flex items-center gap-2 px-4 py-1 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
						<DatabaseIcon className="w-5 h-5 text-primary flex-none" />
						<div>
							<div className="font-medium text-xs text-foreground/70">Total</div>
							<div className="text-lg font-semibold">{totalArticles}</div>
						</div>
					</div>

					{/* Federated Articles */}
					<div className="relative flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
						<GlobeIcon className="w-5 h-5 text-primary flex-none" />
						<div className="w-full">
							<div className="flex items-center gap-1 font-medium text-xs text-foreground/70">
								Federated
							</div>
							<div className="text-lg font-semibold">{federatedArticles}</div>
						</div>
						<Tooltip>
							<TooltipTrigger asChild className="absolute bottom-2 right-2">
								<InfoIcon className="w-4 h-4 text-muted-foreground cursor-pointer flex-none" />
							</TooltipTrigger>
							<TooltipContent side="top" className="text-xs">
								Articles collected from other sources outside your system.
							</TooltipContent>
						</Tooltip>
					</div>

					{/* Analyzed Articles */}
					<div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm col-span-1 sm:col-span-2">
						<CheckCircleIcon className="w-5 h-5 text-primary" />
						<div>
							<div className="font-medium">Analyzed</div>
							<div className="text-lg font-semibold">{analyzedArticles}</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-3 border border-foreground/10 p-3 rounded-xl">
					<h4 className="uppercase text-xs text-foreground/40 m-0 leading-none">Insights</h4>
					{/* Top Sources */}
					<div className="flex items-center gap-2 p-4 rounded-lg bg-gray-100 dark:bg-gray-700 shadow-sm">
						<StarIcon className="w-5 h-5 text-primary flex-none" />
						<div>
							<div className="font-medium">Top Sources</div>
							<div className="text-sm text-muted-foreground">{topSources}</div>
						</div>
					</div>

					{/* Daily Trending */}
					<div className="flex items-center gap-2 p-4 rounded-lg bg-gray-100 dark:bg-gray-700 shadow-sm">
						<TrendingUpIcon className="w-5 h-5 text-primary flex-none" />
						<div>
							<div className="font-medium">Daily Trending</div>
							<div className="text-sm text-muted-foreground">{dailyTrending}</div>
						</div>
					</div>

					{/* Weekly Most Covered */}
					<div className="flex items-center gap-2 p-4 rounded-lg bg-gray-100 dark:bg-gray-700 shadow-sm">
						<CalendarIcon className="w-5 h-5 text-primary flex-none" />
						<div>
							<div className="font-medium">Weekly Most Covered</div>
							<div className="text-sm text-muted-foreground">{weeklyMostCovered}</div>
						</div>
					</div>

					{/* Monthly Insights */}
					<div className="flex items-center gap-2 p-4 rounded-lg bg-gray-100 dark:bg-gray-700 shadow-sm">
						<CalendarIcon className="w-5 h-5 text-primary flex-none" />
						<div>
							<div className="font-medium">Monthly Insights</div>
							<div className="text-sm text-muted-foreground">{monthlyInsights}</div>
						</div>
					</div>
				</div>
			</div>

			{/* Placeholder note */}
			{isPlaceholder && (
				<p className="text-xs text-muted-foreground mt-2 italic">
					No real data provided &mdash; showing placeholder values.
				</p>
			)}
		</div>
	);
};

export default InsightsPanel;
