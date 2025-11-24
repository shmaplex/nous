import { Info } from "lucide-react";
import type React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Ownership categories supported by the system.
 * These map directly to distinct color classes in Tailwind.
 */
export type OwnershipCategory =
	| "independent"
	| "wealthyPrivateOwner"
	| "telecom"
	| "mediaConglomerate"
	| "privateEquity"
	| "other";

/**
 * Represents a mapping of ownership categories to numeric values.
 * Values can be absolute counts or percentages — the component normalizes automatically.
 */
export interface OwnershipDistribution {
	independent?: number;
	wealthyPrivateOwner?: number;
	telecom?: number;
	mediaConglomerate?: number;
	privateEquity?: number;
	other?: number;
}

/**
 * Props for the Ownership component.
 */
export interface OwnershipProps {
	/**
	 * Main (primary) classification for the organization,
	 * typically the largest or overarching ownership category.
	 *
	 * Example: "independent"
	 */
	primary?: OwnershipCategory;

	/**
	 * Detailed ownership breakdown.
	 * Example:
	 * {
	 *   independent: 40,
	 *   wealthyPrivateOwner: 10,
	 *   telecom: 20,
	 *   mediaConglomerate: 10,
	 *   privateEquity: 10,
	 *   other: 10
	 * }
	 */
	distribution?: OwnershipDistribution;

	/**
	 * Whether to show tooltips when hovering over segments.
	 */
	showTooltip?: boolean;
}

/**
 * Ownership component normalizes ownership data and renders:
 * - A title with tooltip
 * - A primary ownership bar
 * - A detailed multi-segment ownership breakdown
 *
 * This component is intended to be the unified structure that all
 * parsed article metadata maps into.
 *
 * @param {OwnershipProps} props - Component properties.
 * @returns {JSX.Element | null} A visual ownership breakdown UI.
 *
 * @example
 * <Ownership
 *   primary="independent"
 *   distribution={{
 *     independent: 40,
 *     wealthyPrivateOwner: 15,
 *     telecom: 20,
 *     mediaConglomerate: 10,
 *     privateEquity: 10,
 *     other: 5
 *   }}
 * />
 */
const Ownership: React.FC<OwnershipProps> = ({
	primary = "independent",
	distribution = {},
	showTooltip = true,
}) => {
	// Extract values with fallbacks
	const {
		independent = 0,
		wealthyPrivateOwner = 0,
		telecom = 0,
		mediaConglomerate = 0,
		privateEquity = 0,
		other = 0,
	} = distribution;

	const total =
		independent + wealthyPrivateOwner + telecom + mediaConglomerate + privateEquity + other;

	// If no data, render nothing
	if (!total) return null;

	// Normalize all segments into percentages
	const calc = (v: number) => (total ? (v / total) * 100 : 0);

	const segments = [
		{
			key: "independent",
			label: "Independent",
			value: calc(independent),
			color: "bg-mediaopoly-independent",
		},
		{
			key: "wealthyPrivateOwner",
			label: "Wealthy Private Owner",
			value: calc(wealthyPrivateOwner),
			color: "bg-mediaopoly-wealthy-private-owner",
		},
		{ key: "telecom", label: "Telecom", value: calc(telecom), color: "bg-mediaopoly-telecom" },
		{
			key: "mediaConglomerate",
			label: "Media Conglomerate",
			value: calc(mediaConglomerate),
			color: "bg-mediaopoly-mediaConglomerate",
		},
		{
			key: "privateEquity",
			label: "Private Equity",
			value: calc(privateEquity),
			color: "bg-mediaopoly-private-equity",
		},
		{ key: "other", label: "Other", value: calc(other), color: "bg-mediaopoly-other" },
	];

	// Primary bar uses full width, just applies the category color
	const primaryColor = segments.find((s) => s.key === primary)?.color ?? "bg-mediaopoly-other";

	return (
		<div className="bg-tertiary-light dark:bg-dark-light p-3 tablet:p-4 flex flex-col gap-3 w-full h-full text-sm dark:text-dark-gray-100 leading-tight rounded-md border border-border">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-1">
					<h3 className="text-base tablet:text-lg font-semibold">Ownership</h3>

					{showTooltip && (
						<Tooltip>
							<TooltipTrigger>
								<Info className="w-4 h-4 text-light-heavy" />
							</TooltipTrigger>
							<TooltipContent sideOffset={4}>
								Ownership describes who ultimately controls this publication.
								<br />
								More concentration generally means less independence.
							</TooltipContent>
						</Tooltip>
					)}
				</div>
			</div>

			{/* Primary Ownership Bar */}
			<div className={`${primaryColor} h-6 rounded-sm`} />

			{/* Detailed Ownership Breakdown */}
			<div className="flex flex-col gap-2">
				<div className="flex w-full text-xs text-light-primary">
					{segments.map(
						(seg) =>
							seg.value > 0 && (
								<div key={seg.key} style={{ width: `${seg.value}%` }}>
									{showTooltip ? (
										<Tooltip>
											<TooltipTrigger>
												<div className={`${seg.color} h-[1.2rem]`} />
											</TooltipTrigger>
											<TooltipContent sideOffset={4}>
												{seg.label}: {seg.value.toFixed(0)}%
											</TooltipContent>
										</Tooltip>
									) : (
										<div className={`${seg.color} h-[1.2rem]`} />
									)}
								</div>
							),
					)}
				</div>
			</div>
		</div>
	);
};

export default Ownership;
