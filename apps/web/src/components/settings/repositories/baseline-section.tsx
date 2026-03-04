"use client";

import { BaselineStatusBadge } from "@/components/settings/repositories/baseline-status-badge";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useActiveBaseline, useBaselineTargets, useMarkBaselineStale } from "@/hooks/use-baselines";
import { formatDateWithYear } from "@/lib/display/format";
import Link from "next/link";

export function BaselineSection({ repoId }: { repoId: string }) {
	const { data: baseline, isLoading } = useActiveBaseline(repoId);
	const { data: targets } = useBaselineTargets(baseline?.id ?? "", !!baseline?.id);
	const markStale = useMarkBaselineStale();

	if (isLoading) {
		return (
			<section>
				<h2 className="text-sm font-medium mb-3">Baseline</h2>
				<LoadingDots size="sm" className="text-muted-foreground" />
			</section>
		);
	}

	if (!baseline) {
		return (
			<section>
				<h2 className="text-sm font-medium mb-3">Baseline</h2>
				<div className="rounded-lg border border-dashed border-border/80 py-6 text-center">
					<p className="text-sm text-muted-foreground">No active baseline</p>
					<p className="text-xs text-muted-foreground mt-1">
						Run setup to create a validated baseline for this repository.
					</p>
					<Button variant="outline" size="sm" className="mt-3 h-7 text-xs" asChild>
						<Link href={`/workspace/setup/${repoId}`}>Run Setup</Link>
					</Button>
				</div>
			</section>
		);
	}

	return (
		<section>
			<div className="flex items-center justify-between mb-3">
				<h2 className="text-sm font-medium">Baseline</h2>
				{baseline.status === "ready" && (
					<Button
						variant="ghost"
						size="sm"
						className="h-7 text-xs text-muted-foreground"
						onClick={() => markStale.mutate({ baselineId: baseline.id })}
						disabled={markStale.isPending}
					>
						{markStale.isPending ? "Marking stale..." : "Force stale"}
					</Button>
				)}
			</div>
			<div className="rounded-lg border border-border/80 bg-background p-4 space-y-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<BaselineStatusBadge status={baseline.status} />
						{baseline.version && (
							<span className="text-xs text-muted-foreground">{baseline.version}</span>
						)}
					</div>
					<span className="text-xs text-muted-foreground">
						{formatDateWithYear(baseline.updatedAt)}
					</span>
				</div>

				{baseline.errorMessage && (
					<p className="text-xs text-destructive">{baseline.errorMessage}</p>
				)}

				{/* Targets */}
				{targets != null && targets.length > 0 ? (
					<div>
						<p className="text-xs text-muted-foreground mb-1.5">
							{targets.length} target{targets.length !== 1 ? "s" : ""}
						</p>
						<div className="space-y-1">
							{targets.map((target) => (
								<div key={target.id} className="text-xs py-0.5">
									<span className="font-medium">{target.name}</span>
									{target.description ? (
										<span className="text-muted-foreground ml-2">{target.description}</span>
									) : null}
								</div>
							))}
						</div>
					</div>
				) : null}

				{/* Commands summary */}
				{(baseline.installCommands || baseline.runCommands || baseline.testCommands) && (
					<div className="border-t border-border/50 pt-3">
						<p className="text-xs text-muted-foreground mb-1.5">Baseline commands</p>
						<div className="space-y-0.5 text-xs">
							{baseline.installCommands != null && (
								<div>
									<span className="text-muted-foreground">install:</span>{" "}
									<span className="font-mono">{JSON.stringify(baseline.installCommands)}</span>
								</div>
							)}
							{baseline.runCommands != null && (
								<div>
									<span className="text-muted-foreground">run:</span>{" "}
									<span className="font-mono">{JSON.stringify(baseline.runCommands)}</span>
								</div>
							)}
							{baseline.testCommands != null && (
								<div>
									<span className="text-muted-foreground">test:</span>{" "}
									<span className="font-mono">{JSON.stringify(baseline.testCommands)}</span>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Re-run setup */}
				{(baseline.status === "stale" || baseline.status === "failed") && (
					<div className="border-t border-border/50 pt-3">
						<Button variant="outline" size="sm" className="h-7 text-xs" asChild>
							<Link href={`/workspace/setup/${repoId}`}>Re-run Setup</Link>
						</Button>
					</div>
				)}
			</div>
		</section>
	);
}
