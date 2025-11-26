import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDebugLogs } from "@/lib/log";
import type { DebugLogEntry, DebugStatus, NodeStatus } from "@/types";

interface DebugPanelProps {
	open: boolean;
	onClose: () => void;
	defaultTab?: string;
	status: NodeStatus;
	debugStatus: DebugStatus;
}

export function DebugPanel({
	open,
	onClose,
	defaultTab = "node",
	status,
	debugStatus,
}: DebugPanelProps) {
	const [logs, setLogs] = useState<DebugLogEntry[]>([]);

	// Fetch logs whenever the panel opens
	useEffect(() => {
		if (!open) return;
		const fetchLogs = async () => {
			const allLogs = await getDebugLogs();
			setLogs(allLogs.slice(-100));
		};
		fetchLogs();
		const interval = setInterval(fetchLogs, 2000); // refresh every 2s
		return () => clearInterval(interval);
	}, [open]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 backdrop-blur-md bg-black/40 flex justify-center items-center overflow-y-auto">
			<Card className="w-full max-w-3xl p-6 bg-card/90 border border-border/50 shadow-2xl rounded-2xl">
				<div className="flex justify-between items-center">
					<h2 className="text-xl font-bold">Debug Panel</h2>
					<Button variant="ghost" size="icon" onClick={onClose}>
						<X className="h-5 w-5" />
					</Button>
				</div>

				{/* Tabs */}
				<Tabs defaultValue={defaultTab} className="w-full">
					<TabsList className="grid grid-cols-3 mb-4 w-full">
						<TabsTrigger value="node">Node</TabsTrigger>
						<TabsTrigger value="peers">Peers</TabsTrigger>
						<TabsTrigger value="fetch">Fetch Status</TabsTrigger>
					</TabsList>

					{/* Node Status */}
					<TabsContent value="node" className="space-y-4">
						<div className="flex flex-wrap gap-6">
							<div className="flex items-center space-x-2">
								<span
									className={`h-3 w-3 rounded-full ${status.running ? "bg-green-500" : "bg-red-500"}`}
								/>
								<span className="text-sm font-medium">
									Node {status.running ? "Running" : "Stopped"}
								</span>
							</div>
							<div className="flex items-center space-x-2">
								<span className="h-3 w-3 rounded-full bg-yellow-400" />
								<span className="text-sm font-medium">HTTP {status.port}</span>
							</div>
							<div className="flex items-center space-x-2">
								<span
									className={`h-3 w-3 rounded-full ${status.orbitConnected ? "bg-green-500" : "bg-red-500"}`}
								/>
								<span className="text-sm font-medium">OrbitDB</span>
							</div>
							<div className="flex items-center space-x-2">
								<span
									className={`h-3 w-3 rounded-full ${status.syncing ? "bg-blue-500 animate-pulse" : "bg-gray-400"}`}
								/>
								<span className="text-sm font-medium">
									{status.syncing ? "Syncing..." : "Idle"}
								</span>
							</div>
							<div className="flex items-center space-x-2">
								<span className="h-3 w-3 rounded-full bg-gray-300" />
								<span className="text-sm font-medium">Last: {status.lastSync ?? "Never"}</span>
							</div>
						</div>

						{/* Recent Logs */}
						<div className="mt-4">
							<h3 className="text-sm font-semibold mb-2">Recent Logs</h3>
							<ScrollArea className="h-48 rounded-md border bg-background/50 p-2 text-xs font-mono">
								{logs.length ? (
									logs.map((log, i) => (
										<div key={i} className="mb-1">
											{log.timestamp} — {log.message}
										</div>
									))
								) : (
									<p>No logs yet.</p>
								)}
							</ScrollArea>
						</div>
					</TabsContent>

					{/* Peers */}
					<TabsContent value="peers">
						<h3 className="font-semibold mb-2">Peers</h3>
						<ScrollArea className="h-72 border rounded-md p-3 bg-background/50 text-sm">
							{logs.filter((log) => log.meta?.type === "peers").length ? (
								<ul className="list-disc pl-5 space-y-3">
									{logs
										.filter((log) => log.meta?.type === "peers")
										.map((log, idx) => {
											const peer = log.meta as {
												peerId?: string;
												connected?: boolean;
												addresses?: string[];
											};
											return (
												<li key={idx}>
													<div className="font-medium">
														{peer.peerId || "Unknown Peer"} —{" "}
														{peer.connected ? "Connected" : "Disconnected"}
													</div>
													{peer.addresses?.length ? (
														<ul className="list-disc pl-5 text-xs opacity-80">
															{peer.addresses.map((addr) => (
																<li key={addr}>{addr}</li>
															))}
														</ul>
													) : null}
												</li>
											);
										})}
								</ul>
							) : (
								<p>No peers found.</p>
							)}
						</ScrollArea>
					</TabsContent>

					{/* Fetch Status */}
					<TabsContent value="fetch">
						<h3 className="font-semibold mb-2">Article Fetch Status</h3>
						<ScrollArea className="h-72 border rounded-md p-3 bg-background/50 text-sm">
							{logs.filter((log) => log.meta?.type === "fetch").length ? (
								logs
									.filter((log) => log.meta?.type === "fetch")
									.map((log, idx) => (
										<div key={idx}>
											{log.timestamp} — {log.message}
										</div>
									))
							) : (
								<p>No fetch logs yet.</p>
							)}
						</ScrollArea>
					</TabsContent>
				</Tabs>
			</Card>
		</div>
	);
}
