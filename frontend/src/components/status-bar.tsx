import { Database, Link, RotateCw, Server, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { NodeStatus } from "@/types";

interface StatusBarProps {
	status: NodeStatus;
	onOpenDebug?: (tab: string) => void;
}

/**
 * Animated dots component for loading state
 */
const LoadingDots: React.FC<{ count?: number }> = ({ count = 3 }) => {
	const [dotIndex, setDotIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setDotIndex((prev) => (prev + 1) % count);
		}, 400);
		return () => clearInterval(interval);
	}, [count]);

	return (
		<span>
			{Array.from({ length: count })
				.map((_, i) => (i <= dotIndex ? "•" : " "))
				.join("")}
		</span>
	);
};

const StatusBar: React.FC<StatusBarProps> = ({ status, onOpenDebug }) => {
	const statusItem = (icon: React.ReactNode, text: React.ReactNode, tooltip?: string) => (
		<div className="flex items-center space-x-1 text-xs sm:text-xs" title={tooltip}>
			{icon}
			<span className="font-medium truncate max-w-[120px]">{text}</span>
		</div>
	);

	const displayOrPlaceholder = (
		value: string | number | null | undefined,
		placeholder: any = <LoadingDots />,
	) => (value !== undefined && value !== null ? value : placeholder);

	return (
		<div className="fixed bottom-0 left-0 w-full px-3 py-0 bg-card text-card-foreground flex justify-between items-center shadow-md z-50 space-x-4 text-xs sm:text-sm">
			{statusItem(
				<Server
					className={`${status.running ? "text-green-400" : "text-red-500"}`}
					size={14}
					fill="currentColor"
				/>,
				status.running ? "Node Running" : <LoadingDots />,
			)}
			{statusItem(
				<Users
					className={`${status.connected ? "text-green-400" : "text-red-500"}`}
					size={14}
					fill="currentColor"
				/>,
				status.connected ? (
					`P2P (${displayOrPlaceholder(status.peers?.length, "0")} peers)`
				) : (
					<LoadingDots />
				),
			)}
			{statusItem(
				<Database
					className={`${status.orbitConnected ? "text-green-400" : "text-red-500"}`}
					size={14}
					fill="currentColor"
				/>,
				status.orbitConnected ? "OrbitDB" : <LoadingDots />,
			)}
			{statusItem(
				<RotateCw
					className={`${status.syncing ? "animate-spin text-blue-400" : "text-gray-500"}`}
					size={14}
				/>,
				status.syncing ? "Syncing..." : `Last: ${displayOrPlaceholder(status.lastSync, "never")}`,
			)}
			{statusItem(
				<Link className="text-yellow-400" size={14} />,
				`Port: ${displayOrPlaceholder(status.port, "9001")}`,
				"HTTP Port",
			)}
			{onOpenDebug && (
				<Button variant="link" size="sm" onClick={() => onOpenDebug("node")}>
					Debug
				</Button>
			)}
		</div>
	);
};

export default StatusBar;
