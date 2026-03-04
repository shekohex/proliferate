"use client";

import { PageShell } from "@/components/dashboard/page-shell";
import { AddRepoDialog } from "@/components/settings/repositories/add-repo-dialog";
import { RepoRow } from "@/components/settings/repositories/repo-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useReposList } from "@/hooks/settings/use-repos-list";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function RepositoriesPage() {
	const [filterQuery, setFilterQuery] = useState("");
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const { repos, filteredRepos, baselinesByRepo, isLoading } = useReposList(filterQuery);

	if (isLoading) {
		return (
			<PageShell title="Repositories">
				<div className="py-12 flex justify-center">
					<LoadingDots size="md" className="text-muted-foreground" />
				</div>
			</PageShell>
		);
	}

	const hasRepos = (repos ?? []).length > 0;
	const hasResults = filteredRepos.length > 0;

	return (
		<PageShell
			title="Repositories"
			actions={
				<div className="flex items-center gap-2">
					{hasRepos && (
						<div className="relative">
							<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
							<Input
								value={filterQuery}
								onChange={(e) => setFilterQuery(e.target.value)}
								placeholder="Search repositories..."
								className="pl-8 h-8 w-56 text-sm"
							/>
						</div>
					)}
					<Button size="sm" className="h-8" onClick={() => setAddDialogOpen(true)}>
						<Plus className="h-3.5 w-3.5 mr-1.5" />
						Add Repository
					</Button>
				</div>
			}
		>
			{!hasRepos ? (
				<div className="rounded-xl border border-dashed border-border py-16 text-center">
					<p className="text-sm text-muted-foreground">No repositories yet</p>
					<p className="text-xs text-muted-foreground mt-1">
						Add a public repository or connect GitHub from Integrations
					</p>
					<div className="flex items-center justify-center gap-3 mt-4">
						<Button size="sm" onClick={() => setAddDialogOpen(true)}>
							<Plus className="h-3.5 w-3.5 mr-1.5" />
							Add Repository
						</Button>
						<Button variant="outline" size="sm" asChild>
							<Link href="/integrations">Go to Integrations</Link>
						</Button>
					</div>
				</div>
			) : !hasResults ? (
				<p className="text-sm text-muted-foreground text-center py-12">
					No repositories matching &ldquo;{filterQuery}&rdquo;
				</p>
			) : (
				<div className="rounded-xl border border-border overflow-hidden">
					{/* Table header */}
					<div className="flex items-center px-4 py-2 pr-12 text-xs text-muted-foreground border-b border-border/50">
						<span className="flex-1 min-w-0">Repository</span>
						<span className="w-20 text-center shrink-0">Branch</span>
						<span className="w-24 text-center shrink-0">Baseline</span>
						<span className="w-20 text-center shrink-0">Status</span>
						<span className="w-16 text-center shrink-0">Source</span>
					</div>

					{filteredRepos.map((repo) => (
						<RepoRow key={repo.id} repo={repo} baseline={baselinesByRepo.get(repo.id)} />
					))}
				</div>
			)}

			<AddRepoDialog
				open={addDialogOpen}
				onOpenChange={setAddDialogOpen}
				existingRepoIds={new Set((repos ?? []).map((r) => r.githubRepoId))}
			/>
		</PageShell>
	);
}
