/**
 * Display formatting utilities.
 */

/**
 * Format a potentially-nullable date string with year included.
 * Returns an em dash when the input is null/undefined.
 */
export function formatDateWithYear(dateStr: string | null | undefined): string {
	if (!dateStr) return "\u2014";
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

/**
 * Derive up to two initials from a user's name, falling back to
 * the first character of their email, or "?" as a last resort.
 */
export function getUserInitials(
	name: string | null | undefined,
	email: string | null | undefined,
): string {
	if (name) {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}
	return email?.[0]?.toUpperCase() || "?";
}
