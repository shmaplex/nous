// frontend/src/components/filters-panel.tsx
import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	biasOptions,
	confidenceOptions,
	coverageOptions,
	editionOptions,
	type FilterOptions,
	sentimentOptions,
} from "@/types/filter";
import { FilterBar } from "./filters/filter-bar";

interface FiltersPanelProps {
	filter: FilterOptions;
	setFilter: (filter: FilterOptions) => void;
}

export default function FiltersPanel({ filter, setFilter }: FiltersPanelProps) {
	const [showFilters, setShowFilters] = useState(false);

	const selectClass =
		"min-w-[100px] sm:min-w-[120px] md:min-w-[140px] rounded-full border border-border bg-background shadow-sm hover:shadow-md transition text-xs sm:text-sm";

	const renderSelect = <T extends string>(
		label: string,
		value: T | undefined,
		options: readonly T[],
		onChange: (val: T) => void,
	) => (
		<div className="flex flex-col gap-1">
			<Label className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</Label>
			<Select value={value ?? ""} onValueChange={(v) => onChange(v as T)}>
				<SelectTrigger className={selectClass} aria-label={label}>
					<SelectValue placeholder={`Select ${label}`} />
				</SelectTrigger>
				<SelectContent className="bg-card border border-border shadow-lg">
					{options.map((option) => (
						<SelectItem
							key={option}
							value={option}
							className="hover:bg-accent hover:text-accent-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground rounded-md text-xs sm:text-sm"
						>
							{option.charAt(0).toUpperCase() + option.slice(1)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);

	// Determine if all filters are default
	const allDefault =
		filter.bias === "all" &&
		filter.sentiment === "all" &&
		filter.coverage === "all" &&
		filter.confidence === "all" &&
		filter.edition === "international";

	return (
		<div className="flex flex-col gap-3 px-4 py-2 bg-card rounded-2xl shadow-md border border-border w-full">
			{/* Pills + Toggle icon */}
			<FilterBar
				filter={filter}
				setFilter={setFilter}
				showFilters={showFilters}
				setShowFilters={setShowFilters}
				allDefault={allDefault}
			/>

			{/* Filter dropdowns */}
			{showFilters && (
				<div className="flex flex-row flex-wrap gap-4 overflow-x-auto mt-2">
					{renderSelect("Political Bias", filter.bias, biasOptions, (v) =>
						setFilter({ ...filter, bias: v }),
					)}
					{renderSelect("Sentiment", filter.sentiment, sentimentOptions, (v) =>
						setFilter({ ...filter, sentiment: v }),
					)}
					{renderSelect("Coverage", filter.coverage, coverageOptions, (v) =>
						setFilter({ ...filter, coverage: v }),
					)}
					{renderSelect("Confidence", filter.confidence, confidenceOptions, (v) =>
						setFilter({ ...filter, confidence: v }),
					)}
					{renderSelect("Edition", filter.edition, editionOptions, (v) =>
						setFilter({ ...filter, edition: v }),
					)}
				</div>
			)}
		</div>
	);
}
