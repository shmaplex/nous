import * as React from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Edition {
	label: string;
	value: string;
	flag: string;
}

const editions: Edition[] = [
	{ label: "International", value: "international", flag: "🌐" },
	{ label: "United States", value: "us", flag: "🇺🇸" },
	{ label: "South Korea", value: "kr", flag: "🇰🇷" },
];

interface LocationSelectorProps {
	selectedEdition?: string;
	onEditionChange?: (value: string) => void;
	className?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
	selectedEdition,
	onEditionChange,
	className,
}) => {
	const [edition, setEdition] = React.useState(selectedEdition || editions[0].value);

	const handleSelect = (value: string) => {
		setEdition(value);
		if (onEditionChange) onEditionChange(value);
	};

	const currentEdition = editions.find((e) => e.value === edition);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				className={`flex items-center gap-2 px-3 py-1 rounded border border-border hover:bg-primary/10 ${className || ""}`}
			>
				<span className="text-lg">{currentEdition?.flag}</span>
				<span className="text-sm">{currentEdition?.label}</span>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="end"
				className="w-48 bg-card border border-border rounded shadow-lg"
			>
				{editions.map((e) => (
					<DropdownMenuItem
						key={e.value}
						onClick={() => handleSelect(e.value)}
						className={
							e.value === edition ? "font-semibold text-foreground" : "font-normal text-foreground"
						}
					>
						<span className="text-lg">{e.flag}</span> {e.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
