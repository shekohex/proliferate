import type { AutomationRunStatus } from "@proliferate/shared";

// ============================================
// Coworker List Page
// ============================================

export type CoworkerListTab = "all" | "active" | "paused";

export const COWORKER_LIST_TABS: { value: CoworkerListTab; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "active", label: "Active" },
	{ value: "paused", label: "Paused" },
];

export type WorkerStatus = "active" | "paused" | "degraded" | "failed";

// ============================================
// Coworker Detail Page
// ============================================

export type CoworkerDetailTab = "activity" | "sessions" | "settings";

export const COWORKER_DETAIL_TABS: { value: CoworkerDetailTab; label: string }[] = [
	{ value: "activity", label: "Activity" },
	{ value: "sessions", label: "Sessions" },
	{ value: "settings", label: "Settings" },
];

// ============================================
// Coworker Events Page
// ============================================

export type RunStatusFilter = "all" | AutomationRunStatus;

export const RUN_STATUS_FILTERS: { value: RunStatusFilter; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "running", label: "Running" },
	{ value: "queued", label: "Queued" },
	{ value: "enriching", label: "Enriching" },
	{ value: "ready", label: "Ready" },
	{ value: "succeeded", label: "Succeeded" },
	{ value: "failed", label: "Failed" },
	{ value: "needs_human", label: "Needs attention" },
	{ value: "timed_out", label: "Timed out" },
	{ value: "skipped", label: "Skipped" },
	{ value: "canceled", label: "Canceled" },
];
