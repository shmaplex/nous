// components/TranslateButton.tsx
"use client";

import { Languages } from "lucide-react";
import type React from "react";
import { AsyncActionButton } from "@/components/button-async";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import type { Article } from "@/types/article";

interface TranslateButtonProps {
	article: Article;
	onTranslate: (article: Article) => Promise<void>;
}

export const TranslateButton: React.FC<TranslateButtonProps> = ({ article, onTranslate }) => {
	const { run, isLoading } = useAsyncAction(() => onTranslate(article));

	return (
		<AsyncActionButton
			isLoading={isLoading}
			onClick={run}
			label="Translate"
			icon={<Languages className="w-4 h-4" />}
			className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:border-blue-500/70!"
		/>
	);
};
