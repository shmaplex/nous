import type React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Props for the BiasBar component.
 */
interface BiasBarProps {
	/** Number of left-leaning sources. Defaults to 0. */
	left?: number;
	/** Number of center-leaning sources. Defaults to 0. */
	center?: number;
	/** Number of right-leaning sources. Defaults to 0. */
	right?: number;
	/** Number of sources with no identified bias. Defaults to 0. */
	none?: number;
	/** Optional single-bias mode. If provided, the bar will show a single color for this bias. */
	bias?: "left" | "center" | "right" | "none";
	/** Whether to show tooltips on hover. Defaults to true. */
	showTooltip?: boolean;
}

/**
 * BiasBar component visualizes the political bias distribution of sources.
 * It can operate in two modes:
 * - Numeric breakdown mode: shows relative widths of left, center, right, and none biases.
 * - Single-bias mode: displays a single full-width color for a given bias.
 *
 * @param {BiasBarProps} props - Props for the BiasBar component.
 * @returns {JSX.Element | null} A horizontal bar showing bias distribution, or null if no data.
 *
 * @example
 * <BiasBar left={10} center={5} right={3} none={2} showTooltip={true} />
 *
 * @example
 * <BiasBar bias="left" showTooltip={false} />
 */
const BiasBar: React.FC<BiasBarProps> = ({
	left = 0,
	center = 0,
	right = 0,
	none = 0,
	bias,
	showTooltip = true,
}) => {
	let segments: { key: string; value: number; color: string }[] = [];

	if (bias) {
		// Single-key mode: full width for the specified bias
		segments = [{ key: bias, value: 100, color: `bg-bias-${bias}` }];
	} else {
		// Numeric breakdown mode
		const total = left + center + right + none;
		if (total === 0) return null;

		const percentages = {
			left: (left / total) * 100,
			center: (center / total) * 100,
			right: (right / total) * 100,
			none: (none / total) * 100,
		};

		segments = [
			{ key: "left", value: percentages.left, color: "bg-bias-left" },
			{ key: "center", value: percentages.center, color: "bg-bias-center" },
			{ key: "right", value: percentages.right, color: "bg-bias-right" },
			{ key: "none", value: percentages.none, color: "bg-bias-none" },
		];
	}

	return (
		<div className="w-full h-2 flex overflow-hidden rounded-t-md border-b border-border">
			{segments.map(
				(seg) =>
					seg.value > 0 && (
						<div key={seg.key} style={{ width: `${seg.value}%` }}>
							{showTooltip ? (
								<Tooltip>
									<TooltipTrigger>
										<div className={`${seg.color} h-full`} />
									</TooltipTrigger>
									<TooltipContent sideOffset={4}>
										{`${seg.key.toUpperCase()}${!bias ? `: ${seg.value.toFixed(0)}%` : ""}`}
									</TooltipContent>
								</Tooltip>
							) : (
								<div className={`${seg.color} h-full`} />
							)}
						</div>
					),
			)}
		</div>
	);
};

export default BiasBar;
