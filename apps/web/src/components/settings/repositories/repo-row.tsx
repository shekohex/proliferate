"use client";

import { BaselineStatusBadge } from "@/components/settings/repositories/baseline-status-badge";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BaselineInfo } from "@/hooks/settings/use-repos-list";
import { useDeleteRepo } from "@/hooks/use-repos";
import type { Repo } from "@/types";
import { ExternalLink, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function RepoRow({ repo, baseline }: { repo: Repo; baseline?: BaselineInfo }) {
	const deleteRepo = useDeleteRepo();
	const [deleteOpen, setDeleteOpen] = useState(false);

	const handleDelete = async () => {
		await deleteRepo.mutateAsync({ id: repo.id });
		setDeleteOpen(false);
	};

	return (
		<>
			<div className="border-b border-border/50 last:border-0">
				<Link
					href={`/settings/repositories/${repo.id}`}
					className="flex items-center hover:bg-muted/50 transition-colors px-4 py-2.5 text-sm"
				>
					<span className="flex-1 min-w-0 font-medium truncate">{repo.githubRepoName}</span>
					<span className="w-20 text-center text-xs text-muted-foreground shrink-0">
						{repo.defaultBranch || "main"}
					</span>
					<span className="w-24 text-center text-xs text-muted-foreground shrink-0 truncate">
						{baseline?.version ?? "\u2014"}
					</span>
					<span className="w-20 flex justify-center shrink-0">
						{baseline ? (
							<BaselineStatusBadge status={baseline.status} />
						) : (
							<span className="text-xs text-muted-foreground">\u2014</span>
						)}
					</span>
					<span className="w-16 text-center text-xs text-muted-foreground shrink-0">
						{repo.source === "github-app" ? "GitHub" : repo.isPrivate ? "Private" : "Public"}
					</span>

					<div className="shrink-0 ml-2" onClick={(e) => e.preventDefault()}>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-7 w-7">
									<MoreVertical className="h-3.5 w-3.5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem asChild>
									<Link href={`/settings/repositories/${repo.id}`}>View details</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<a href={repo.githubUrl} target="_blank" rel="noopener noreferrer">
										<ExternalLink className="h-4 w-4 mr-2" />
										Open on GitHub
									</a>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive">
									<Trash2 className="h-4 w-4 mr-2" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</Link>
			</div>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete repository</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove {repo.githubRepoName}? This will not affect
							configurations that reference this repository.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteRepo.isPending ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
