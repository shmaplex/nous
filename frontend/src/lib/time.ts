// frontend/src/lib/time.ts
/**
 * Returns a human-friendly relative time string for a given date.
 *
 * Examples:
 * - "just now"
 * - "10 minutes ago"
 * - "in 2 hours"
 * - "3 days ago"
 *
 * If the date is invalid or missing, returns "Unknown".
 *
 * @param {string | undefined} dateString - The ISO date string or timestamp to convert.
 * @returns {string} A relative time string like "10 minutes ago" or "Unknown" if invalid.
 */
export const getRelativeTime = (dateString?: string): string => {
	if (!dateString) return "Unknown";

	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return "Unknown"; // Prevent RangeError for invalid dates

	const now = new Date();
	const diffMs = date.getTime() - now.getTime();
	const diffSec = Math.round(diffMs / 1000);
	const diffMin = Math.round(diffSec / 60);
	const diffHour = Math.round(diffMin / 60);
	const diffDay = Math.round(diffHour / 24);

	const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

	if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "seconds");
	if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minutes");
	if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hours");
	return rtf.format(diffDay, "days");
};
