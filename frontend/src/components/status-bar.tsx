import { Circle, RotateCw } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { AppStatus } from "../../wailsjs/go/main/App";

const StatusBar: React.FC = () => {
	const [status, setStatus] = useState({
		connected: false,
		syncing: false,
		lastSync: null as string | null,
	});

	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				const stat = await AppStatus(); // Wails call to GetP2PStatus
				setStatus(JSON.parse(stat));
			} catch (err) {
				console.error("Failed to fetch status", err);
			}
		}, 3000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="fixed bottom-0 left-0 w-full p-3 bg-gray-900 text-white flex justify-between items-center shadow-md z-50">
			{/* Connection Status */}
			<div className="flex items-center space-x-2">
				<Circle
					className={`${status.connected ? "text-green-400" : "text-red-500"}`}
					size={14}
					fill={status.connected ? "currentColor" : "currentColor"}
				/>
				<span className="text-sm font-medium">{status.connected ? "Connected" : "Offline"}</span>
			</div>

			{/* Sync Status */}
			<div className="flex items-center space-x-2">
				<RotateCw
					className={`${status.syncing ? "animate-spin text-blue-400" : "text-gray-500"}`}
					size={16}
				/>
				<span className="text-sm">
					{status.syncing ? "Syncing..." : `Last sync: ${status.lastSync ?? "never"}`}
				</span>
			</div>
		</div>
	);
};

export default StatusBar;
