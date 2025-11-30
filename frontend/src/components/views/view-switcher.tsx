/**
 * @file view-switcher.tsx
 * @description
 * Production-ready modern view switcher component using shadcn-ui and Tailwind.
 *
 * Allows toggling between the two primary UX modes:
 *  • Workbench → Raw articles, analysis workflow, data tools
 *  • Reading   → Clean reading mode showing analyzed + enriched articles
 *
 * Fully theme-aware via inline Tailwind tokens (`bg-primary`, `bg-muted`, etc.)
 * and optimized for dark/light mode with backdrop blur + sticky placement.
 */

import type React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ViewMode } from "@/types/view";

interface Props {
	/**
	 * Currently active view mode.
	 */
	mode: ViewMode;

	/**
	 * Callback fired on mode change.
	 */
	onChange: (view: ViewMode) => void;
}

/**
 * ViewSwitcher Component
 *
 * A Perplexity-style segmented control used to toggle between "Work" and "Read"
 * operational modes in the Nous desktop client.
 */
const ViewSwitcher: React.FC<Props> = ({ mode, onChange }) => {
	return (
		<div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md py-2 px-6 flex items-center justify-center shadow-sm">
			<ToggleGroup
				type="single"
				value={mode}
				onValueChange={(value) => value && onChange(value as ViewMode)}
				className="bg-muted/40 p-1 rounded-xl border border-border shadow-sm"
			>
				{/* Workbench Mode */}
				<ToggleGroupItem
					value="workbench"
					className={`
            px-5 py-2.5 text-sm font-medium rounded-md
            transition-all duration-200
            data-[state=on]:bg-primary data-[state=on]:text-primary-foreground
            data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground
            hover:bg-muted/70
          `}
				>
					Workbench
				</ToggleGroupItem>

				{/* Reading Mode */}
				<ToggleGroupItem
					value="reading"
					className={`
            px-5 py-2.5 text-sm font-medium rounded-md
            transition-all duration-200
            data-[state=on]:bg-primary data-[state=on]:text-primary-foreground
            data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground
            hover:bg-muted/70
          `}
				>
					Reading Mode
				</ToggleGroupItem>
			</ToggleGroup>
		</div>
	);
};

export default ViewSwitcher;
