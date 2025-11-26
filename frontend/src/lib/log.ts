// frontend/src/lib/log.ts
import { v4 as uuidv4 } from "uuid";
import type { DebugLogEntry } from "@/types";
import { AddDebugLog, FetchDebugLogs } from "../../wailsjs/go/main/App";

/**
 * Console log helper
 * @param message Message to log
 * @param save Whether to also persist via backend/Wails
 */
export function log(message: string, save = false) {
	console.log(`[P2P NODE] ${new Date().toISOString()} - ${message}`);
	if (save) {
		addDebugLog({ message });
	}
}

/**
 * Add a debug entry via Wails backend
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
		// Use Wails Go backend function
		if (AddDebugLog) {
			await AddDebugLog(logEntry.message, logEntry.level, logEntry.meta || {});
		} else {
			console.warn("Wails AddDebugLog not available, skipping backend save");
		}
	} catch (err) {
		console.error("Failed to persist debug log via backend:", err);
	}
}

/**
 * Fetch all debug logs via Wails backend
 */
export async function getDebugLogs(): Promise<DebugLogEntry[]> {
	try {
		if (FetchDebugLogs) {
			const res = await FetchDebugLogs();
			const logs: DebugLogEntry[] = JSON.parse(res || "[]");
			return logs;
		}
		console.warn("Wails FetchDebugLogs not available, returning empty array");
		return [];
	} catch (err) {
		console.error("Error fetching debug logs via backend:", err);
		return [];
	}
}
