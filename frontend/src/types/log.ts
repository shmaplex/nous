// frontend/src/types/log.ts
export interface DebugLogEntry {
	_id: string;
	timestamp: string;
	message: string;
	level: "info" | "warn" | "error";
	meta?: Record<string, any>; // optional extra info like lastSync, port
}
