"use client";

import { Button } from "@/components/ui/button";
import { PageBackLink } from "@/components/ui/page-back-link";
import { StatusDot } from "@/components/ui/status-dot";
import { useAutomation } from "@/hooks/use-automations";
import Link from "next/link";

export function LegacyAutomationDetail({ id }: { id: string }) {
	const { data: automation, isLoading, error } = useAutomation(id);

	if (isLoading) {
		return (
			<div className="bg-background flex flex-col grow min-h-0 overflow-y-auto">
				<div className="w-full max-w-4xl mx-auto px-6 py-8">
					<div className="animate-pulse space-y-6">
						<div className="h-8 w-48 bg-muted rounded" />
						<div className="h-12 bg-muted rounded-xl" />
						<div className="h-48 bg-muted rounded-xl" />
					</div>
				</div>
			</div>
		);
	}

	if (error || !automation) {
		return (
			<div className="bg-background flex flex-col grow min-h-0 overflow-y-auto">
				<div className="w-full max-w-4xl mx-auto px-6 py-8">
					<PageBackLink href="/coworkers" label="Coworkers" className="mb-3" />
					<p className="text-sm text-destructive">Coworker not found</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-background flex flex-col grow min-h-0 overflow-y-auto">
			<div className="w-full max-w-4xl mx-auto px-6 py-8">
				<PageBackLink href="/coworkers" label="Coworkers" className="mb-3" />
				<div className="flex items-center gap-3 mb-6">
					<h1 className="text-lg font-semibold tracking-tight text-foreground">
						{automation.name}
					</h1>
					<StatusDot status={automation.enabled ? "active" : "paused"} size="sm" />
					<span className="text-sm text-muted-foreground">
						{automation.enabled ? "Active" : "Paused"}
					</span>
				</div>
				<p className="text-sm text-muted-foreground">
					This coworker uses the legacy automation system. Configuration is available via the events
					page.
				</p>
				<div className="flex gap-2 mt-4">
					<Button size="sm" variant="outline" asChild>
						<Link href={`/coworkers/${id}/events`}>View events</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
