/**
 * @file perspective-bullets.tsx
 * @description
 * Tabbed view of Left / Center / Right perspectives with an inline Bias Comparison button.
 * Active tab highlights using Tailwind bias colors.
 * Hover on inactive tabs shows a lighter bias color.
 * Selecting Bias Comparison hides other tab bullets and shows the comparison in place.
 * "Insights by Nous AI" is displayed at the bottom with a tooltip explanation.
 * Uses Wails OpenURL for the "Something wrong?" link.
 */

import { AlertTriangle, Info } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { OpenURL } from "../../../wailsjs/go/main/App";

interface PerspectiveBulletsProps {
	leftPoints: string[];
	centerPoints: string[];
	rightPoints: string[];
	biasComparisonPoints?: string[];
}

/** URL for reporting issues */
const REPORT_URL = "https://github.com/shmaplex/nous/issues";

const PerspectiveBullets: React.FC<PerspectiveBulletsProps> = ({
	leftPoints,
	centerPoints,
	rightPoints,
	biasComparisonPoints = [],
}) => {
	const [activeTab, setActiveTab] = useState<"left" | "center" | "right">("center");
	const [showBiasComparison, setShowBiasComparison] = useState(false);
	const [hoveredTab, setHoveredTab] = useState<"left" | "center" | "right" | null>(null);

	const renderList = (points: string[]) => (
		<ul className="list-disc pl-5 space-y-2">
			{points.map((point, index) => (
				<li key={index} className="text-gray-900 dark:text-gray-100 text-sm">
					{point}
				</li>
			))}
		</ul>
	);

	/** Mapping for Tailwind classes for bias colors */
	const biasBg = {
		left: "bg-red-600 hover:bg-red-500 text-white",
		center: "bg-gray-600 hover:bg-gray-500 text-white",
		right: "bg-blue-600 hover:bg-blue-500 text-white",
		comparison: "bg-purple-600 hover:bg-purple-500 text-white",
	};

	const biasOutline = {
		left: "border-red-600 hover:bg-red-100 hover:text-red-700",
		center: "border-gray-600 hover:bg-gray-100 hover:text-gray-700",
		right: "border-blue-600 hover:bg-blue-100 hover:text-blue-700",
		comparison: "border-purple-600 hover:bg-purple-100 hover:text-purple-700",
	};

	const getTabClasses = (tab: "left" | "center" | "right") => {
		if (activeTab === tab && !showBiasComparison) return biasBg[tab];
		return `${biasOutline[tab]} border rounded`;
	};

	const getBiasComparisonClasses = () => {
		if (showBiasComparison)
			return `${biasBg.comparison} rounded flex items-center gap-1 ml-2 px-2 py-1`;
		return `${biasOutline.comparison} rounded flex items-center gap-1 ml-2 px-2 py-1`;
	};

	return (
		<div className="flex flex-col gap-4 bg-secondary dark:bg-card p-4 rounded-xl shadow-sm border border-border">
			{/* Tabs + Bias Comparison Button */}
			<div className="flex items-center gap-2 mb-4">
				<div className="flex gap-2">
					{(["left", "center", "right"] as const).map((tab) => (
						<Button
							key={tab}
							size="sm"
							variant="outline"
							className={`px-2 py-1 ${getTabClasses(tab)}`}
							onClick={() => {
								setActiveTab(tab);
								setShowBiasComparison(false);
							}}
						>
							{tab.charAt(0).toUpperCase() + tab.slice(1)}
						</Button>
					))}
				</div>

				{/* Bias Comparison Button inline */}
				{biasComparisonPoints.length > 0 && (
					<Button
						variant="outline"
						size="sm"
						className={getBiasComparisonClasses()}
						onClick={() => setShowBiasComparison((prev) => !prev)}
					>
						<Info className="w-4 h-4" />
						Bias Comparison
					</Button>
				)}
			</div>

			{/* Selected Perspective Bullets or Bias Comparison */}
			<div>
				{showBiasComparison && biasComparisonPoints.length > 0
					? renderList(biasComparisonPoints)
					: activeTab === "left"
						? renderList(leftPoints)
						: activeTab === "center"
							? renderList(centerPoints)
							: renderList(rightPoints)}
			</div>

			{/* Insights + "Something wrong?" link */}
			<div className="w-full flex items-center justify-between mt-4">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="flex items-center gap-2 text-xs group cursor-pointer">
								<Info className="w-4 h-4 text-blue-500/50 group-hover:text-blue-500 transition-colors duration-500 ease-in-out" />
								<span className="font-medium text-gray-800 dark:text-gray-300 transition-colors duration-500 ease-in-out">
									Insights by Nous AI
								</span>
							</div>
						</TooltipTrigger>
						<TooltipContent className="max-w-sm text-sm ml-2">
							The AI provides an intelligent, multi-perspective analysis of news articles. It
							evaluates potential political bias, sentiment, and coverage differences across
							sources, and then generates concise perspective summaries for left, center, and right
							viewpoints. The bias comparison highlights key differences between perspectives to
							help you quickly understand the framing of information and potential blindspots.
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				<Button
					variant="ghost"
					size="sm"
					className="gap-1 flex text-xs items-center hover:text-red-500"
					onClick={() => OpenURL(REPORT_URL)}
				>
					<AlertTriangle className="w-3 h-3" />
					Something wrong?
				</Button>
			</div>
		</div>
	);
};

export default PerspectiveBullets;
