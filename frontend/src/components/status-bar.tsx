import { Circle, Database, Link, RotateCw, Server } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { loadLatestStatus } from "@/lib/utils";
import type { NodeStatus } from "@/types";

interface StatusBarProps {
	onOpenDebug?: (tab: string) => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ onOpenDebug }) => {
	const [status, setStatus] = useState<NodeStatus>({
		running: false,
		connected: false,
		orbitConnected: false,
		syncing: false,
		lastSync: null,
		peers: [],
		logs: [],
		port: 9001,
	});

	useEffect(() => {
		const interval = setInterval(() => {
			try {
				const latest = loadLatestStatus();
				if (latest) {
					setStatus((prev: any) => ({ ...prev, ...latest }));
				}
			} catch (err) {
				console.error("Failed to load latest status:", err);
			}
		}, 3000);

		return () => clearInterval(interval);
	}, []);

	const statusItem = (icon: React.ReactNode, text: string, tooltip?: string) => (
		<div className="flex items-center space-x-1 text-xs sm:text-xs" title={tooltip}>
			{icon}
			<span className="font-medium truncate max-w-[120px]">{text}</span>
		</div>
	);

	return (
		<div className="fixed bottom-0 left-0 w-full px-3 py-0 bg-card text-card-foreground flex justify-between items-center shadow-md z-50 space-x-4 text-xs sm:text-sm">
			{statusItem(
				<Server
					className={`${status.running ? "text-green-400" : "text-red-500"}`}
					size={14}
					fill="currentColor"
				/>,
				status.running ? "Node Running" : "Stopped",
			)}
			{statusItem(
				<Circle
					className={`${status.connected ? "text-green-400" : "text-red-500"}`}
					size={14}
					fill="currentColor"
				/>,
				status.connected ? `P2P (${status.peers?.length || 0})` : "P2P Offline",
			)}
			{statusItem(
				<Database
					className={`${status.orbitConnected ? "text-green-400" : "text-red-500"}`}
					size={14}
					fill="currentColor"
				/>,
				status.orbitConnected ? "OrbitDB" : "OrbitDB Offline",
			)}
			{statusItem(
				<RotateCw
					className={`${status.syncing ? "animate-spin text-blue-400" : "text-gray-500"}`}
					size={14}
				/>,
				status.syncing ? "Syncing..." : `Last: ${status.lastSync ?? "never"}`,
			)}
			{statusItem(
				<Link className="text-yellow-400" size={14} />,
				`Port: ${status.port}`,
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
