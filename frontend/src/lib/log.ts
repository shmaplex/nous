// frontend/src/lib/log.ts

import { v4 as uuidv4 } from "uuid";
import type { DebugLogEntry } from "@/types";

/**
 * Console log helper
 */
export function log(message: string, save = false) {
	console.log(`[P2P NODE] ${new Date().toISOString()} - ${message}`);
	if (save) {
		addDebugLog({
			message: `[P2P NODE] ${new Date().toISOString()} - ${message}`,
		});
	}
}

/**
 * Add debug entry
 */
export async function addDebugLog(entry: {
	message: string;
	level?: "info" | "warn" | "error";
	meta?: Record<string, any>;
	type?: string;
}) {
	const logEntry: DebugLogEntry = {
		_id: uuidv4(),
		timestamp: new Date().toISOString(),
		message: entry.message,
		level: entry.level ?? "info",
		meta: { ...entry.meta, type: entry.type },
	};

	// console output
	switch (logEntry.level) {
		case "warn":
			console.warn(`[DEBUG] ${logEntry.timestamp} - ${logEntry.message}`);
			break;
		case "error":
			console.error(`[DEBUG] ${logEntry.timestamp} - ${logEntry.message}`);
			break;
		default:
			console.log(`[DEBUG] ${logEntry.timestamp} - ${logEntry.message}`);
	}

	try {
		await fetch("http://127.0.0.1:9001/debug/log", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(logEntry),
		});
	} catch (err) {
		console.error("Failed to persist debug log:", err);
	}
}

/**
 * Fetch all debug logs from backend /debug/logs route
 */
export async function getDebugLogs(): Promise<DebugLogEntry[]> {
	try {
		const res = await fetch("http://127.0.0.1:9001/debug/logs");
		if (!res.ok) {
			console.error("Failed to fetch debug logs:", res.statusText);
			return [];
		}
		const data: DebugLogEntry[] = await res.json();
		return data;
	} catch (err) {
		console.error("Error fetching debug logs:", err);
		return [];
	}
}
