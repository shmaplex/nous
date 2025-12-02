import { motion } from "framer-motion";
import React from "react";
import type { ArticleAnalyzed } from "@/types";

/**
 * Props:
 *  - sentiment: "positive" | "neutral" | "negative" | undefined
 *  - sentimentValence: number | undefined  // -1 to 1
 */
export default function SentimentMeter({
	sentiment,
	sentimentValence,
}: {
	sentiment: ArticleAnalyzed["sentiment"];
	sentimentValence: ArticleAnalyzed["sentimentValence"];
}) {
	const hasValence = typeof sentimentValence === "number";

	// Map valence to bar fill percentage (0–100)
	const percentage = hasValence ? ((sentimentValence + 1) / 2) * 100 : 50;

	// Map valence to a soft color gradient
	const color = hasValence
		? `hsl(${percentage}, 70%, 50%)` // red → yellow → green
		: "hsl(0, 0%, 80%)"; // neutral gray when nothing available

	return (
		<div className="w-full max-w-sm p-4 rounded-2xl shadow-md bg-white border border-gray-200 flex flex-col gap-3">
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-semibold">Sentiment</h3>
				<span className="text-sm text-gray-500">{sentiment ?? "N/A"}</span>
			</div>

			{/* Meter background */}
			<div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
				{/* Animated fill */}
				<motion.div
					className="h-full"
					initial={{ width: 0 }}
					animate={{ width: `${percentage}%` }}
					transition={{ type: "spring", stiffness: 120, damping: 20 }}
					style={{ backgroundColor: color }}
				/>
			</div>

			{/* Value display */}
			<div className="text-center text-sm text-gray-600">
				{hasValence ? (
					<span>Valence: {sentimentValence.toFixed(2)}</span>
				) : (
					<span className="italic text-gray-400">No sentiment data available</span>
				)}
			</div>
		</div>
	);
}
