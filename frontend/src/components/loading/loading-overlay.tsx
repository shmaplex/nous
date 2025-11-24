// frontend/src/components/loading/loading-overlay.tsx

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface LoadingOverlayProps {
	open: boolean;
	status: string;
	progress: number; // 0–100
}

export function LoadingOverlay({ open, status, progress }: LoadingOverlayProps) {
	/** Rotating feature messages */
	const features = [
		"Analyzing bias across global news sources",
		"Detecting sentiment and subjectivity",
		"Mapping real-time information flow",
		"Syncing distributed sources from your node",
		"Building your personal news intelligence dashboard",
	];

	const [index, setIndex] = useState(0);

	useEffect(() => {
		if (!open) return;
		const id = setInterval(() => {
			setIndex((prev) => (prev + 1) % features.length);
		}, 2600);
		return () => clearInterval(id);
	}, [open]);

	return (
		<Dialog open={open}>
			<DialogContent className="max-w-md border-none bg-background/60 backdrop-blur-xl shadow-xl">
				<div className="text-center flex flex-col items-center space-y-6 py-8 px-4">
					{/* Title */}
					<h2 className="text-2xl font-semibold">Loading your news intelligence...</h2>

					{/* Rotating feature text */}
					<div className="h-10 flex items-center justify-center">
						<p key={index} className="text-sm text-muted-foreground animate-fade">
							{features[index]}
						</p>
					</div>

					{/* Progress bar */}
					<div className="w-full">
						<Progress value={progress} />
					</div>

					{/* Status */}
					<p className="text-xs text-muted-foreground">{status}</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
