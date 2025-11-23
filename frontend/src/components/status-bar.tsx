import { Circle, Database, Link, RotateCw, Server } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppStatus } from "../../wailsjs/go/main/App";

interface ConnectionInfo {
	peerId: string;
	addresses: string[];
	connected: boolean;
}

interface NodeStatus {
	running: boolean;
	connected: boolean;
	orbitConnected: boolean;
	syncing: boolean;
	lastSync: string | null;
	port?: number;
	peers?: ConnectionInfo[];
	logs?: string[];
}

const StatusBar: React.FC = () => {
	const [status, setStatus] = useState<NodeStatus>({
		running: false,
		connected: false,
		orbitConnected: false,
		syncing: false,
		lastSync: null,
		peers: [],
		port: 9001,
		logs: [],
	});

	const [showOverlay, setShowOverlay] = useState(false);

	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				const raw = await AppStatus();
				const parsed: NodeStatus = raw
					? (() => {
							try {
								const data = JSON.parse(raw);
								return { ...data, port: data.port ?? 9001 }; // fallback to 9001
							} catch {
								return {
									running: false,
									connected: false,
									orbitConnected: false,
									syncing: false,
									lastSync: null,
									peers: [],
									port: 9001,
								};
							}
						})()
					: {
							running: false,
							connected: false,
							orbitConnected: false,
							syncing: false,
							lastSync: null,
							peers: [],
							port: 9001,
						};
				setStatus(parsed);
			} catch {
				setStatus((prev) => ({
					...prev,
					running: false,
					connected: false,
					orbitConnected: false,
					syncing: false,
				}));
			}
		}, 3000);

		return () => clearInterval(interval);
	}, []);

	const statusItem = (icon: React.ReactNode, text: string, tooltip?: string) => (
		<div className="flex items-center space-x-1 text-xs sm:text-sm" title={tooltip}>
			{icon}
			<span className="font-medium truncate max-w-[120px]">{text}</span>
		</div>
	);

	return (
		<>
			<div className="fixed bottom-0 left-0 w-full px-3 py-2 bg-card text-card-foreground flex justify-between items-center shadow-md z-50 space-x-4 text-xs sm:text-sm">
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
				<Button variant="outline" size="sm" onClick={() => setShowOverlay(!showOverlay)}>
					Debug
				</Button>
			</div>

			{showOverlay && (
				<div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-start p-6 overflow-auto">
					<div className="bg-card text-card-foreground p-6 rounded-lg max-w-2xl w-full space-y-4">
						<h2 className="text-lg font-bold">Node Debug</h2>
						<p>Status: {status.running ? "Running" : "Stopped"}</p>
						<p>HTTP Port: {status.port}</p>
						<p>P2P Peers: {status.peers?.length || 0}</p>
						<ul className="list-disc pl-5 max-h-64 overflow-auto text-sm">
							{status.peers?.map((peer) => (
								<li key={peer.peerId}>
									{peer.peerId} — {peer.connected ? "Connected" : "Disconnected"}
									<ul className="list-decimal pl-5 text-xs">
										{peer.addresses.map((addr) => (
											<li key={addr}>{addr}</li>
										))}
									</ul>
								</li>
							))}
						</ul>
						<h3 className="text-md font-semibold">Recent Logs</h3>
						<div className="bg-card p-2 rounded h-40 overflow-auto text-xs font-mono">
							{status.logs?.slice(-50).map((log, idx) => (
								<div key={idx}>{log}</div>
							))}
						</div>
						<Button variant="secondary" onClick={() => setShowOverlay(false)}>
							Close
						</Button>
					</div>
				</div>
			)}
		</>
	);
};

export default StatusBar;
