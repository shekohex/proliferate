"use client";

import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useSecrets } from "@/hooks/use-secrets";
import { cn } from "@/lib/utils";
import { Key } from "lucide-react";
import Link from "next/link";

export function EnvironmentSection({ repoId }: { repoId: string }) {
	const { data: allSecrets, isLoading } = useSecrets();

	if (isLoading) {
		return (
			<section>
				<h2 className="text-sm font-medium mb-3">Environment</h2>
				<LoadingDots size="sm" className="text-muted-foreground" />
			</section>
		);
	}

	const secrets = allSecrets ?? [];
	const repoSecrets = secrets.filter((s) => s.repo_id === repoId);
	const orgSecrets = secrets.filter((s) => !s.repo_id);

	const repoKeys = new Set(repoSecrets.map((s) => s.key));
	const hasSecrets = repoSecrets.length > 0 || orgSecrets.length > 0;

	return (
		<section>
			<div className="flex items-center justify-between mb-3">
				<h2 className="text-sm font-medium">Environment</h2>
				<Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
					<Link href="/settings/secrets">Manage secrets</Link>
				</Button>
			</div>

			{!hasSecrets ? (
				<div className="rounded-lg border border-dashed border-border/80 py-6 text-center">
					<p className="text-sm text-muted-foreground">No secrets configured</p>
					<p className="text-xs text-muted-foreground mt-1">
						Secrets are injected at session start. Values are never exposed.
					</p>
				</div>
			) : (
				<div className="rounded-lg border border-border/80 bg-background p-4 space-y-3">
					<p className="text-xs text-muted-foreground">
						Secrets are injected at session start. Values are never exposed in the UI. Repo-scoped
						secrets take precedence over org-wide secrets.
					</p>

					{/* Repo-scoped secrets */}
					{repoSecrets.length > 0 && (
						<div>
							<p className="text-xs text-muted-foreground mb-1.5">
								Repo-scoped ({repoSecrets.length})
							</p>
							<div className="space-y-0.5">
								{repoSecrets.map((secret) => (
									<div key={secret.id} className="flex items-center gap-2 text-xs py-0.5">
										<Key className="h-3 w-3 text-muted-foreground shrink-0" />
										<span className="font-medium">{secret.key}</span>
										{secret.description && (
											<span className="text-muted-foreground truncate">{secret.description}</span>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Org-wide secrets (excluding those overridden by repo-scoped) */}
					{orgSecrets.length > 0 && (
						<div>
							<p className="text-xs text-muted-foreground mb-1.5">Org-wide ({orgSecrets.length})</p>
							<div className="space-y-0.5">
								{orgSecrets.map((secret) => (
									<div key={secret.id} className="flex items-center gap-2 text-xs py-0.5">
										<Key className="h-3 w-3 text-muted-foreground shrink-0" />
										<span
											className={cn(
												"font-medium",
												repoKeys.has(secret.key) && "line-through text-muted-foreground",
											)}
										>
											{secret.key}
										</span>
										{repoKeys.has(secret.key) && (
											<span className="text-muted-foreground">(overridden)</span>
										)}
										{secret.description && !repoKeys.has(secret.key) && (
											<span className="text-muted-foreground truncate">{secret.description}</span>
										)}
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</section>
	);
}
