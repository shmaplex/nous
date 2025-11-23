import type React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FiltersProps {
	filter: string;
	onChange: (val: string) => void;
}

const Filters: React.FC<FiltersProps> = ({ filter, onChange }) => {
	const options = ["all", "left", "center", "right"];

	const bgMap: Record<string, string> = {
		all: "!bg-bias-none",
		left: "!bg-bias-left",
		center: "!bg-bias-center",
		right: "!bg-bias-right",
	};

	const inactiveMap: Record<string, string> = {
		all: "!border-bias-none !text-bias-none",
		left: "!border-bias-left !text-bias-left",
		center: "!border-bias-center !text-bias-center",
		right: "!border-bias-right !text-bias-right",
	};

	const hoverBgMap: Record<string, string> = {
		all: "!hover:bg-bias-none/15",
		left: "!hover:bg-bias-left/15",
		center: "!hover:bg-bias-center/15",
		right: "!hover:bg-bias-right/15",
	};

	return (
		<nav className="flex space-x-2 mb-6">
			{options.map((f) => {
				const isActive = filter === f;

				return (
					<Button
						key={f}
						size="sm"
						onClick={() => onChange(f)}
						variant="outline"
						className={cn(
							"capitalize border-2 transition-all duration-150 bg-transparent", // <- important!

							// ACTIVE → Solid background + readable text
							isActive && `${bgMap[f]} text-white border-transparent`,

							// INACTIVE → Colored border + colored text
							!isActive && inactiveMap[f],

							// Hover tint
							hoverBgMap[f],

							"hover:scale-[1.02]",
						)}
					>
						{f}
					</Button>
				);
			})}
		</nav>
	);
};

export default Filters;
