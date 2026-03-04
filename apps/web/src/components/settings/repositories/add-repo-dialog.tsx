"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useCreateRepo, useSearchRepos } from "@/hooks/use-repos";
import { cn } from "@/lib/utils";
import type { GitHubRepo } from "@/types";
import { Search, Star } from "lucide-react";
import { useEffect, useState } from "react";

export function AddRepoDialog({
	open,
	onOpenChange,
	existingRepoIds,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	existingRepoIds: Set<string>;
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [addingRepoId, setAddingRepoId] = useState<number | null>(null);
	const createRepo = useCreateRepo();

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Reset search when dialog closes
	useEffect(() => {
		if (!open) {
			setSearchQuery("");
			setDebouncedQuery("");
		}
	}, [open]);

	const { data: searchResults, isLoading: searchLoading } = useSearchRepos(
		debouncedQuery,
		debouncedQuery.length >= 2,
	);

	const handleAddRepo = async (repo: GitHubRepo) => {
		setAddingRepoId(repo.id);
		try {
			await createRepo.mutateAsync({
				githubRepoId: String(repo.id),
				githubRepoName: repo.full_name,
				githubUrl: repo.html_url,
				defaultBranch: repo.default_branch,
			});
			onOpenChange(false);
		} catch {
			// Error is surfaced by TanStack Query's mutation state
		} finally {
			setAddingRepoId(null);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Add Repository</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search public repos (e.g., vercel/next.js)"
							className="pl-9 h-9 text-sm"
							autoFocus
						/>
					</div>

					<div className="max-h-72 overflow-y-auto">
						{searchLoading ? (
							<div className="py-8 flex justify-center">
								<LoadingDots size="sm" className="text-muted-foreground" />
							</div>
						) : searchResults && searchResults.length > 0 ? (
							<div className="space-y-0.5">
								{searchResults.map((repo) => {
									const isConnected = existingRepoIds.has(String(repo.id));

									return (
										<div
											key={repo.id}
											className={cn(
												"flex items-center justify-between py-2 px-2 rounded-md transition-colors",
												isConnected ? "opacity-50" : "hover:bg-muted/50",
											)}
										>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium truncate">{repo.full_name}</p>
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													{repo.stargazers_count !== undefined && (
														<span className="flex items-center gap-0.5">
															<Star className="h-3 w-3" />
															{repo.stargazers_count.toLocaleString()}
														</span>
													)}
													{repo.language && <span>{repo.language}</span>}
													<span>{repo.default_branch}</span>
												</div>
											</div>
											{isConnected ? (
												<span className="text-xs text-muted-foreground shrink-0 ml-3">
													Connected
												</span>
											) : (
												<Button
													variant="outline"
													size="sm"
													className="h-7 text-xs shrink-0 ml-3"
													onClick={() => handleAddRepo(repo)}
													disabled={addingRepoId === repo.id}
												>
													{addingRepoId === repo.id ? "..." : "Add"}
												</Button>
											)}
										</div>
									);
								})}
							</div>
						) : debouncedQuery.length >= 2 ? (
							<p className="text-sm text-muted-foreground text-center py-8">
								No public repositories found
							</p>
						) : (
							<p className="text-sm text-muted-foreground text-center py-8">
								Enter at least 2 characters to search
							</p>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
