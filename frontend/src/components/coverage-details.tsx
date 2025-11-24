import type React from "react";

/**
 * Props for the CoverageDetails component.
 */
interface CoverageDetailsProps {
	/** Total number of news sources. Defaults to 21. */
	totalSources?: number;
	/** Number of sources leaning left. Defaults to 10. */
	left?: number;
	/** Number of sources leaning right. Defaults to 3. */
	right?: number;
	/** Number of sources with a center bias. Defaults to 5. */
	center?: number;
	/** ISO string representing the last update time. Defaults to 1 hour ago. */
	lastUpdated?: string;
	/** Textual representation of bias distribution. Defaults to "55% Left". */
	biasDistribution?: string;
}

/**
 * CoverageDetails component displays a breakdown of news sources by political bias,
 * total sources, last update time, and bias distribution. It is hidden on small screens
 * and displayed as a column grid on large screens (`lg` and above).
 *
 * **Notes:**
 * - "Left" and "Right" values follow **internationally accepted political bias conventions**, not just US red/blue standards.
 * - For example, "Left" generally refers to progressive or socialist-leaning sources, while "Right" refers to conservative or nationalist-leaning sources.
 *
 * @param {CoverageDetailsProps} props - The props for the component.
 * @returns {JSX.Element} A styled coverage details grid.
 *
 * @example
 * <CoverageDetails
 *    totalSources={25}
 *    left={12}
 *    right={5}
 *    center={8}
 *    lastUpdated="2025-11-24T06:34:32.000Z"
 *    biasDistribution="48% Left, 20% Center, 32% Right"
 * />
 */
const CoverageDetails: React.FC<CoverageDetailsProps> = ({
	totalSources = 21,
	left = 10,
	right = 3,
	center = 5,
	lastUpdated,
	biasDistribution = "55% Left",
}) => {
	// Fallback for lastUpdated to 1 hour ago if not provided
	const formattedLastUpdated = lastUpdated
		? lastUpdated
		: new Date(Date.now() - 60 * 60 * 1000).toISOString();

	return (
		<div className="hidden lg:flex flex-col gap-4">
			<div className="grid grid-cols-2 gap-y-4 text-18 font-normal bg-tertiary-light dark:bg-dark-light p-4 rounded-md border border-border">
				<h3 className="col-span-2 font-bold">Coverage Details</h3>

				<div className="col-span-2 flex justify-between">
					<span>Total News Sources</span>
					<span className="text-right font-bold">{totalSources}</span>
				</div>

				<span>Leaning Left</span>
				<span className="text-right font-bold">{left}</span>

				<span>Leaning Right</span>
				<span className="text-right font-bold">{right}</span>

				<span>Center</span>
				<span className="text-right font-bold">{center}</span>

				<span>Last Updated</span>
				<span className="text-right font-bold">
					<time dateTime={formattedLastUpdated}>
						{new Date(formattedLastUpdated).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}{" "}
						ago
					</time>
				</span>

				<span>Bias Distribution</span>
				<span className="text-right font-bold">
					<div>{biasDistribution}</div>
				</span>

				{/* International bias note */}
				<div className="col-span-2 text-xs text-muted-foreground mt-2">
					Note: "Left" and "Right" values reflect internationally accepted political bias
					conventions, not US-specific red/blue standards.
				</div>
			</div>
		</div>
	);
};

export default CoverageDetails;
