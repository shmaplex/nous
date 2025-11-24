import { Info } from "lucide-react";
import type React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Represents the factuality rating categories.
 */
export type FactualityLevel = "low" | "medium" | "high";

/**
 * Distribution breakdown for factuality.
 * Values do not need to sum to 100 — normalization is automatic.
 */
export interface FactualityDistribution {
	low?: number;
	medium?: number;
	high?: number;
}

/**
 * Props for the Factuality component.
 */
export interface FactualityProps {
	/**
	 * Overall factual accuracy score (0–100).
	 *
	 * This represents the system-generated factuality rating
	 * for the *normalized* article. It corresponds to your
	 * global evaluation pipeline.
	 *
	 * @default 70
	 */
	accuracyPercent?: number;

	/**
	 * A more granular distribution of factuality judgments.
	 *
	 * For example:
	 * `{ low: 20, medium: 10, high: 70 }`
	 *
	 * @default { low: 40, high: 60 }
	 */
	distribution?: FactualityDistribution;

	/**
	 * Optional text describing how the factuality was determined.
	 *
	 * This is useful for transparency (e.g. "Based on cross-source
	 * comparison, retraction history, and claim consensus").
	 */
	methodologyNote?: string;
}

/**
 * Factuality component displays:
 * - A high-level accuracy bar (0–100%)
 * - A segmented distribution bar showing low/medium/high factuality portions
 * - Tooltip explanation of what factuality means
 *
 * This component is meant to be the **normalized factuality summary**
 * for parsed articles from diverse global news sources.
 *
 * It is intentionally simple, transparent, and free of UX related
 * to payments, upgrades, or feature gating.
 *
 * Tailwind + shadcn is used for styling.
 *
 * @param {FactualityProps} props - Props for the Factuality component.
 * @returns {JSX.Element} The rendered factuality UI.
 *
 * @example
 * <Factuality
 *   accuracyPercent={82}
 *   distribution={{ low: 10, medium: 20, high: 70 }}
 *   methodologyNote="Calculated using source reliability, cross-checking, and historical accuracy data."
 * />
 */
const Factuality: React.FC<FactualityProps> = ({
	accuracyPercent = 70,
	distribution = { low: 40, high: 60 },
	methodologyNote,
}) => {
	const low = distribution.low ?? 0;
	const medium = distribution.medium ?? 0;
	const high = distribution.high ?? 0;

	const total = low + medium + high || 1;

	// Normalize distribution into percent widths
	const lowPercent = (low / total) * 100;
	const medPercent = (medium / total) * 100;
	const highPercent = (high / total) * 100;

	return (
		<div className="bg-tertiary-light dark:bg-dark-light p-3 tablet:p-4 flex flex-col gap-3 w-full h-full text-sm dark:text-dark-gray-100 leading-tight rounded-md border border-border">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1">
					<h3 className="text-base tablet:text-lg font-semibold flex items-center">Factuality</h3>

					{/* Info Tooltip */}
					<Tooltip>
						<TooltipTrigger>
							<Info className="w-4 h-4 text-light-heavy" />
						</TooltipTrigger>
						<TooltipContent sideOffset={4}>
							A higher factuality score indicates more reliable reporting, fewer corrections, and
							stronger multi-source agreement.
						</TooltipContent>
					</Tooltip>
				</div>
			</div>

			{/* Optional methodology note */}
			{methodologyNote && <p className="text-xs text-muted-foreground">{methodologyNote}</p>}

			{/* Main Accuracy Bar */}
			<div className="relative w-full h-6 rounded-sm bg-muted overflow-hidden">
				<div
					className="absolute top-0 left-0 h-full bg-factuality-high transition-all"
					style={{ width: `${accuracyPercent}%` }}
				/>
			</div>

			{/* Distribution Segments */}
			<div className="flex flex-col gap-2">
				<div className="flex w-full text-light-primary text-xs">
					{lowPercent > 0 && (
						<div
							className="bg-factuality-low py-1 text-center"
							style={{ width: `${lowPercent}%` }}
						/>
					)}
					{medPercent > 0 && (
						<div
							className="bg-factuality-medium py-1 text-center"
							style={{ width: `${medPercent}%` }}
						/>
					)}
					{highPercent > 0 && (
						<div
							className="bg-factuality-high py-1 text-center"
							style={{ width: `${highPercent}%` }}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default Factuality;
