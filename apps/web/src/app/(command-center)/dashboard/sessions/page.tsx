"use client";

import { SessionsList } from "@/components/sessions/sessions-list";
import type { OriginFilter } from "@/config/sessions";
import { Suspense } from "react";

const ORIGIN_OPTIONS: { value: OriginFilter; label: string }[] = [
	{ value: "all", label: "All Origins" },
	{ value: "manual", label: "Manual" },
	{ value: "automation", label: "Coworker" },
	{ value: "slack", label: "Slack" },
	{ value: "cli", label: "CLI" },
];

function DashboardSessionsTableHeader() {
	return (
		<div className="flex items-center px-4 py-1.5 border-b border-border/50 bg-muted/20 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
			<span className="flex-1 min-w-0">Session</span>
			<span className="w-24 shrink-0 hidden md:block">Repo</span>
			<span className="w-28 shrink-0 hidden md:block">Branch</span>
			<span className="w-20 shrink-0">Status</span>
			<span className="w-24 shrink-0">Attention</span>
			<span className="w-20 shrink-0 hidden md:block">Origin</span>
			<span className="w-20 shrink-0 hidden md:block">Creator</span>
			<span className="w-20 shrink-0">Updated</span>
			<span className="w-6 shrink-0" />
		</div>
	);
}

export default function SessionsPage() {
	return (
		<Suspense>
			<SessionsList
				automationOriginValue="automation"
				originOptions={ORIGIN_OPTIONS}
				newSessionPath="/sessions"
				showCreatorFilter
				enableSorting
				tableHeader={<DashboardSessionsTableHeader />}
			/>
		</Suspense>
	);
}
