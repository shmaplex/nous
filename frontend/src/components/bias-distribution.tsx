import type React from "react";
import BiasBar from "./bias-bar";

/**
 * Represents a single news source.
 */
interface Source {
	/** The display name of the source. */
	name: string;
	/** The URL to the source's website. */
	url: string;
	/** The URL to the source's logo or image. */
	imageUrl: string;
	/** Political bias of the source. */
	bias: "left" | "center" | "right" | "none";
}

/**
 * Props for the BiasDistribution component.
 */
interface BiasDistributionProps {
	/** Array of news sources to display. */
	sources: Source[];
	/** Whether to show tooltips on the BiasBar component. Defaults to true. */
	showTooltip?: boolean;
}

/**
 * BiasDistribution component displays a summary of news sources by political bias.
 * It includes a summary bias bar, percentage breakdown, and a grid of source logos.
 *
 * @param {BiasDistributionProps} props - The props for the component.
 * @returns {JSX.Element} A component showing bias distribution of sources.
 *
 * @example
 * const sources = [
 *   { name: "Source A", url: "https://a.com", imageUrl: "/a.png", bias: "left" },
 *   { name: "Source B", url: "https://b.com", imageUrl: "/b.png", bias: "center" },
 *   { name: "Source C", url: "https://c.com", imageUrl: "/c.png", bias: "right" },
 * ];
 *
 * <BiasDistribution sources={sources} showTooltip={false} />
 */
const BiasDistribution: React.FC<BiasDistributionProps> = ({ sources, showTooltip = true }) => {
	const total = sources.length;
	const leftCount = sources.filter((s) => s.bias === "left").length;
	const centerCount = sources.filter((s) => s.bias === "center").length;
	const rightCount = sources.filter((s) => s.bias === "right").length;
	const noneCount = sources.filter((s) => s.bias === "none").length;

	const leftPercent = (leftCount / total) * 100;
	const centerPercent = (centerCount / total) * 100;
	const rightPercent = (rightCount / total) * 100;
	const nonePercent = (noneCount / total) * 100;

	return (
		<div className="flex flex-col w-full gap-4">
			{/* Header */}
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-semibold">Bias Distribution</h3>
				<span className="text-sm text-gray-500">{`Total sources: ${total}`}</span>
			</div>

			{/* Summary Bias Bar */}
			<BiasBar
				left={leftCount}
				center={centerCount}
				right={rightCount}
				none={noneCount}
				showTooltip={showTooltip}
			/>

			{/* Percentages labels */}
			<div className="flex justify-between text-xs text-gray-600 mt-1">
				<span>{`L ${leftPercent.toFixed(0)}%`}</span>
				<span>{`C ${centerPercent.toFixed(0)}%`}</span>
				<span>{`R ${rightPercent.toFixed(0)}%`}</span>
				<span>{`N ${nonePercent.toFixed(0)}%`}</span>
			</div>

			{/* Sources grid */}
			<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mt-2">
				{sources.map((source, idx) => (
					<a
						key={idx}
						href={source.url}
						target="_blank"
						rel="noopener noreferrer"
						className="group relative"
					>
						<img
							src={source.imageUrl}
							alt={source.name}
							className="w-10 h-10 rounded-full border border-gray-200 group-hover:scale-105 transition-transform"
						/>
						<span className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100">
							{source.bias.toUpperCase()}
						</span>
					</a>
				))}
			</div>
		</div>
	);
};

export default BiasDistribution;
