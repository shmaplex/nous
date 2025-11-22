import type React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface BiasBarProps {
	left?: number;
	center?: number;
	right?: number;
	none?: number;
	showTooltip?: boolean;
}

const BiasBar: React.FC<BiasBarProps> = ({
	left = 0,
	center = 0,
	right = 0,
	none = 0,
	showTooltip = true,
}) => {
	const total = left + center + right + none;
	if (total === 0) return null;

	const percentages = {
		left: (left / total) * 100,
		center: (center / total) * 100,
		right: (right / total) * 100,
		none: (none / total) * 100,
	};

	const segments = [
		{ key: "left", value: percentages.left, color: "bg-bias-left" },
		{ key: "center", value: percentages.center, color: "bg-bias-center" },
		{ key: "right", value: percentages.right, color: "bg-bias-right" },
		{ key: "none", value: percentages.none, color: "bg-bias-none" },
	];

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
										{`${seg.key.toUpperCase()}: ${seg.value.toFixed(0)}%`}
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
