import { Info, Wrench } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";

interface PerspectiveBulletsProps {
	/** Bullet points for the left-leaning perspective */
	leftPoints: string[];
	/** Bullet points for the center/neutral perspective */
	centerPoints: string[];
	/** Bullet points for the right-leaning perspective */
	rightPoints: string[];
	/** Optional bullet points for an overall bias comparison analysis */
	biasComparisonPoints?: string[];
}

/**
 * Renders a structured view of multiple perspectives on a topic.
 * Shows Left, Center, Right perspectives along with an optional Bias Comparison section.
 */
const PerspectiveBullets: React.FC<PerspectiveBulletsProps> = ({
	leftPoints,
	centerPoints,
	rightPoints,
	biasComparisonPoints = [],
}) => {
	/** Helper to render a list of bullet points */
	const renderList = (points: string[]) => (
		<ul className="list-disc pl-5 space-y-2">
			{points.map((point, index) => (
				<li key={index} className="text-14 text-gray-900 dark:text-gray-100">
					{point}
				</li>
			))}
		</ul>
	);

	return (
		<div className="flex flex-col gap-6">
			{/* Top Insight Bar */}
			<div className="flex gap-3 w-full justify-between items-center pt-2">
				<div className="flex flex-col md:flex-row md:items-center gap-2 relative text-14 w-full font-normal mb-4">
					<button type="button" className="flex items-center gap-2" aria-expanded={false}>
						<Info className="text-light-heavy w-4 h-4" />
						<div className="font-normal flex gap-2 justify-center py-1 px-2 w-fit items-center rounded-md bg-gray-100 dark:bg-gray-800">
							Insights by Nous AI
						</div>
					</button>
				</div>

				<div className="flex items-center gap-2 justify-end w-full font-normal">
					<Button variant="secondary" size="sm" className="flex gap-2 items-center">
						<Wrench className="w-4 h-4" />
						Does this summary seem wrong?
					</Button>
				</div>
			</div>

			{/* Bias Comparison Section */}
			{biasComparisonPoints.length > 0 && (
				<div className="gap-2 font-normal text-14 items-center order-2 cursor-pointer flex tablet:flex-row mb-4">
					<Button
						id="analysis-summary-button"
						variant="secondary"
						size="sm"
						className="flex justify-around items-center order-2 w-full"
					>
						<span className="flex items-center gap-1">
							<Info className="w-4 h-4" />
							Bias Comparison
						</span>
					</Button>
					<div className="mt-2 w-full">{renderList(biasComparisonPoints)}</div>
				</div>
			)}

			{/* Perspective Lists */}
			<div className="flex flex-col gap-8 tablet:flex-row tablet:gap-12">
				{/* Left Perspective */}
				<div className="flex-1 border-r border-gray-300 pr-4 tablet:pr-6">
					<h3 className="text-16 font-semibold mb-2">Left Perspective</h3>
					{renderList(leftPoints)}
				</div>

				{/* Center Perspective */}
				<div className="flex-1 border-r border-gray-300 px-4 tablet:px-6">
					<h3 className="text-16 font-semibold mb-2">Center Perspective</h3>
					{renderList(centerPoints)}
				</div>

				{/* Right Perspective */}
				<div className="flex-1 pl-4 tablet:pl-6">
					<h3 className="text-16 font-semibold mb-2">Right Perspective</h3>
					{renderList(rightPoints)}
				</div>
			</div>
		</div>
	);
};

export default PerspectiveBullets;
