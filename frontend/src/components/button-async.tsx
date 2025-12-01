// components/AsyncActionButton.tsx
"use client";

import type React from "react";
import { Button } from "@/components/ui/button";

interface AsyncActionButtonProps {
	isLoading: boolean;
	onClick: (e: React.MouseEvent) => void;
	label: string;
	icon?: React.ReactNode;
	className?: string;
	variant?: string;
	size?: string;
}

/**
 * A generic button wrapper for async actions with built-in loading state.
 */
export const AsyncActionButton: React.FC<AsyncActionButtonProps> = ({
	isLoading,
	onClick,
	label,
	icon,
	className,
	variant = "outline",
	size = "sm",
}) => (
	<Button
		onClick={onClick}
		disabled={isLoading}
		className={className}
		variant={variant as any}
		size={size as any}
	>
		{isLoading ? (
			<span className="w-3 h-3 animate-spin border-2 border-current border-t-transparent rounded-full" />
		) : (
			icon
		)}
		{isLoading ? `${label}...` : label}
	</Button>
);
