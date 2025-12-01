// components/AnalyzeButton.tsx
"use client";

import { Sparkles } from "lucide-react";
import type React from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import type { Article } from "@/types/article";
import { AsyncActionButton } from "./button-async";

interface AnalyzeButtonProps {
	article: Article;
	onAnalyze: (article: Article) => Promise<void>;
	className?: string;
}

/**
 * Button to run article analysis with loading state.
 */
export const AnalyzeButton: React.FC<AnalyzeButtonProps> = ({
	article,
	onAnalyze,
	className = "h-7 px-2 py-0 text-xs gap-1 border-accent/40 text-accent hover:bg-accent/10",
}) => {
	const { run, isLoading } = useAsyncAction(() => onAnalyze(article));

	return (
		<AsyncActionButton
			isLoading={isLoading}
			onClick={run}
			label="Analyze"
			icon={<Sparkles className="w-3 h-3" />}
			className={className}
			variant="outline"
			size="sm"
		/>
	);
};
