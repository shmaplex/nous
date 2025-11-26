import { z } from "zod";
import { type DebugLogEntry, DebugLogEntrySchema } from "@/types";
import { parseApiResponse } from "@/types/api";
import { AddDebugLog, FetchDebugLogs } from "../../wailsjs/go/main/App";

/**
 * Console log helper
 * @param message Message to log
 * @param save Whether to persist via backend/Wails
 */
export function log(message: string, save = false) {
	console.log(`[P2P NODE] ${new Date().toISOString()} - ${message}`);
	if (save) addDebugLog({ message });
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
		_id: crypto.randomUUID(),
		timestamp: new Date().toISOString(),
		message: entry.message,
		level: entry.level ?? "info",
		meta: { ...entry.meta, type: entry.type },
	};

	// local console output
	const prefix = `[DEBUG] ${logEntry.timestamp} - ${logEntry.message}`;
	if (logEntry.level === "warn") console.warn(prefix);
	else if (logEntry.level === "error") console.error(prefix);
	else console.log(prefix);

	try {
		if (AddDebugLog) {
			await AddDebugLog(logEntry);
		} else {
			console.warn("Wails AddDebugLog not available, skipping backend save");
		}
	} catch (err) {
		console.error("Failed to persist debug log via backend:", err);
	}
}

/**
 * Fetch all debug logs using the APIResponse<T> schema
 */
export async function getDebugLogs(): Promise<DebugLogEntry[]> {
	try {
		const raw = await FetchDebugLogs(); // returns JSON string from backend

		// Parse response using generic helper, specifying an array of DebugLogEntry
		const response = parseApiResponse(JSON.parse(raw), z.array(DebugLogEntrySchema));

		if (!response.success) {
			console.warn("Debug logs fetch error:", response.error);
			return [];
		}

		return response.data ?? [];
	} catch (err) {
		console.error("Failed to fetch debug logs:", err);
		return [];
	}
}
