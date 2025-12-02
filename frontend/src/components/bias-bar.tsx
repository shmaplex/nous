import type React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { PoliticalBias } from "@/types";

/**
 * Props for the BiasBar component.
 */
export interface BiasBarProps {
	/** Number of left-leaning sources. Defaults to 0. */
	left?: number;

	/** Number of center-leaning sources. Defaults to 0. */
	center?: number;

	/** Number of right-leaning sources. Defaults to 0. */
	right?: number;

	/** Number of sources with no identified bias. Defaults to 0. */
	none?: number;

	/**
	 * Optional single-bias mode.
	 * If provided, the bar displays a full-width color for this bias.
	 */
	bias?: PoliticalBias;

	/** Whether to show tooltips on hover. Defaults to true. */
	showTooltip?: boolean;
}

/**
 * Safe union of all possible bias segment keys used in UI.
 * This keeps typing consistent with the CSS variables:
 *   --bias-left
 *   --bias-lean-left
 *   --bias-center
 *   --bias-right
 *   --bias-lean-right
 *   --bias-none
 *   --bias-unknown
 */
type BiasKey = "left" | "center" | "right" | "none";

/** Internal type for each visual segment of the bar. */
interface BiasSegment {
	key: BiasKey | PoliticalBias;
	value: number;
	color: string; // Tailwind class, e.g. "bg-bias-left"
}

/**
 * BiasBar component visualizes the political bias distribution of sources.
 *
 * It supports two modes:
 *
 * ### 1. **Distribution mode** (default)
 * Shows the percent breakdown of `left`, `center`, `right`, `none`.
 *
 * ### 2. **Single-bias mode**
 * When `bias` prop is provided, displays a single full-width color.
 *
 *
 * @param {BiasBarProps} props - Props for the BiasBar component.
 * @returns {JSX.Element | null} A horizontal bar showing bias distribution, or null if no data.
 *
 * @example
 * <BiasBar left={10} center={5} right={3} none={2} />
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
	let segments: BiasSegment[] = [];

	if (bias) {
		// Single-bias mode (full-width)
		segments = [
			{
				key: bias,
				value: 100,
				color: `bg-bias-${bias}`,
			},
		];
	} else {
		// Distribution mode
		const total = left + center + right + none;
		if (total === 0) return null;

		segments = [
			{
				key: "left",
				value: (left / total) * 100,
				color: "bg-bias-left",
			},
			{
				key: "center",
				value: (center / total) * 100,
				color: "bg-bias-center",
			},
			{
				key: "right",
				value: (right / total) * 100,
				color: "bg-bias-right",
			},
			{
				key: "none",
				value: (none / total) * 100,
				color: "bg-bias-none",
			},
		];
	}

	return (
		<div className="w-full h-3 flex overflow-hidden rounded-t-md border-b border-border">
			{segments.map(
				(seg) =>
					seg.value > 0 && (
						<div key={seg.key} style={{ width: `${seg.value}%` }}>
							{showTooltip ? (
								<Tooltip>
									<TooltipTrigger asChild>
										<div className={`${seg.color} h-full`} />
									</TooltipTrigger>

									<TooltipContent sideOffset={4}>
										{seg.key.toString().toUpperCase()}
										{!bias && `: ${seg.value.toFixed(0)}%`}
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
