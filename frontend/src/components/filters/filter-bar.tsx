import { InfoIcon, ListFilterIcon, ListFilterPlusIcon, ListRestartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { FilterOptions } from "@/types/filter";

interface FilterBarProps {
	filter: FilterOptions;
	setFilter: (filter: FilterOptions) => void;
	showFilters: boolean;
	setShowFilters: (show: boolean) => void;
	allDefault?: boolean;
}

export function FilterBar({
	filter,
	setFilter,
	showFilters,
	setShowFilters,
	allDefault = false,
}: FilterBarProps) {
	const renderPill = (label: string, value: string | undefined, onClear: () => void) => (
		<Button
			variant="outline"
			size="sm"
			key={label}
			className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs sm:text-sm whitespace-nowrap ${
				value === "all" ? "text-muted-foreground" : ""
			}`}
			onClick={onClear}
		>
			<span className="capitalize">
				{label}: {value}
			</span>
			<span className="text-muted-foreground">✕</span>
		</Button>
	);

	return (
		<div className="flex items-center justify-between flex-wrap gap-2 overflow-x-auto pb-1">
			{/* Pills + All filters info */}
			<div className="flex items-center gap-2">
				{allDefault && (
					<Tooltip>
						<TooltipTrigger>
							<div className="w-5 h-5 flex items-center justify-center rounded-full bg-muted text-muted-foreground">
								<InfoIcon className="w-3.5 h-3.5" />
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p>All filters are applied</p>
						</TooltipContent>
					</Tooltip>
				)}

				{/* Pills */}
				<div className="flex flex-wrap gap-2 overflow-x-auto">
					{renderPill("Bias", filter.bias, () => setFilter({ ...filter, bias: "all" }))}
					{renderPill("Sentiment", filter.sentiment, () =>
						setFilter({ ...filter, sentiment: "all" }),
					)}
					{renderPill("Coverage", filter.coverage, () => setFilter({ ...filter, coverage: "all" }))}
					{renderPill("Confidence", filter.confidence, () =>
						setFilter({ ...filter, confidence: "all" }),
					)}
					{renderPill("Edition", filter.edition, () =>
						setFilter({ ...filter, edition: "international" }),
					)}
				</div>
			</div>

			{/* Action icons */}
			<div className="flex gap-2">
				<Button
					variant="ghost"
					size="sm"
					className="p-1"
					onClick={() =>
						setFilter({
							bias: "all",
							sentiment: "all",
							coverage: "all",
							confidence: "all",
							edition: "international",
						})
					}
					title="Reset all filters"
				>
					<ListRestartIcon className="w-5 h-5" />
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className="p-1"
					onClick={() => setShowFilters(!showFilters)}
					title={showFilters ? "Hide filters" : "Adjust filters"}
				>
					{showFilters ? (
						<ListFilterIcon className="w-5 h-5 text-primary" />
					) : (
						<ListFilterPlusIcon className="w-5 h-5" />
					)}
				</Button>
			</div>
			{showFilters && <Separator />}
		</div>
	);
}
