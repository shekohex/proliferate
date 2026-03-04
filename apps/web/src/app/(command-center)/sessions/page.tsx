"use client";

import { SessionsList } from "@/components/sessions/sessions-list";
import type { OriginFilter } from "@/config/sessions";
import { Suspense } from "react";

const ORIGIN_OPTIONS: { value: OriginFilter; label: string }[] = [
	{ value: "all", label: "All Origins" },
	{ value: "manual", label: "Manual" },
	{ value: "coworker", label: "Coworker" },
	{ value: "slack", label: "Slack" },
	{ value: "cli", label: "CLI" },
];

function SessionsTableHeader() {
	return (
		<div className="hidden md:flex items-center px-4 py-1.5 border-b border-border/50 bg-muted/20 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
			<span className="flex-1">Session</span>
			<span className="w-28 shrink-0">Configuration</span>
		</div>
	);
}

export default function SessionsPage() {
	return (
		<Suspense>
			<SessionsList
				automationOriginValue="coworker"
				originOptions={ORIGIN_OPTIONS}
				newSessionPath="/dashboard"
				tableHeader={<SessionsTableHeader />}
			/>
		</Suspense>
	);
}
