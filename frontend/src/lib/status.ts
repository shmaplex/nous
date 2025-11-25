// frontend/src/lib/status.ts
import type { NodeStatus } from "@/types";
// These come from wailsjs/go/main/App
import { AppDeleteStatus, AppStatus, AppUpdateStatus } from "../../wailsjs/go/main/App";
import { log } from "./log";

// In-memory status
let status: NodeStatus = {
	running: false,
	connected: false,
	syncing: false,
	orbitConnected: false,
	lastSync: null,
	peers: [],
	logs: [],
	port: 9001,
};

/**
 * Fetch latest NodeStatus from Go backend (AppStatus)
 */
export async function loadLatestStatus(): Promise<Partial<NodeStatus> | null> {
	try {
		const raw = await AppStatus(); // returns JSON string
		const data = JSON.parse(raw) as NodeStatus;

		status = data; // update local singleton
		return data;
	} catch (err) {
		log(`❌ Failed to load status from Go backend: ${(err as Error).message}`);
		return null;
	}
}

/**
 * Update NodeStatus via backend POST (AppUpdateStatus)
 */
export async function updateStatus(newStatus: Partial<NodeStatus>): Promise<NodeStatus> {
	try {
		const raw = await AppUpdateStatus(JSON.stringify(newStatus));
		const updated = JSON.parse(raw) as NodeStatus;

		status = updated;
		return updated;
	} catch (err) {
		log(`❌ Failed to send status update to Go backend: ${(err as Error).message}`);

		// Local fallback (so UI still updates)
		status = { ...status, ...newStatus };
		if (newStatus.syncing === false) {
			status.lastSync = new Date().toISOString();
		}

		return status;
	}
}

/**
 * Hydrate an existing status object via Go backend
 */
export async function hydrateStatusFromServer(statusObj: NodeStatus) {
	const latest = await loadLatestStatus();
	if (!latest) return statusObj;

	Object.assign(statusObj, latest);
	return statusObj;
}

/**
 * Clear local in-memory status
 */
export function clearStatus() {
	status = {
		running: false,
		connected: false,
		syncing: false,
		orbitConnected: false,
		lastSync: null,
		peers: [],
		logs: [],
		port: 9001,
	};

	return status;
}

/**
 * Delete local status
 */
export async function deleteStatus() {
	try {
		const raw = await AppDeleteStatus(); // Go backend DELETE /status
		const resp = JSON.parse(raw);

		if (resp.error) {
			log(`❌ Failed to delete status via Go backend: ${resp.error}`);
		} else {
			log("✅ Status file deleted.");
		}
	} catch (err) {
		log(`❌ Failed to delete status: ${(err as Error).message}`);
	}

	// Reset local in-memory status no matter what
	status = clearStatus();

	return status;
}
