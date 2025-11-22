import { Clock } from "lucide-react"; // Lucide icon
import type React from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils"; // Utility for classNames

interface TimeDisplayProps {
	className?: string;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({ className }) => {
	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		const interval = setInterval(() => setCurrentTime(new Date()), 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div
			className={cn(
				"flex items-center space-x-2 px-3 py-2 rounded-lg bg-card text-card-foreground",
				className,
			)}
		>
			<Clock className="w-4 h-4 text-primary" />
			<time dateTime={currentTime.toISOString()} className="font-medium">
				{currentTime.toLocaleString(undefined, {
					weekday: "short",
					month: "short",
					day: "numeric",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				})}
			</time>
		</div>
	);
};
