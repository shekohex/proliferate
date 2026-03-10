"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRepos } from "@/hooks/org/use-repos";
import {
	useAssignSecretToRepos,
	useRemoveSecretFromRepos,
	useUpdateSecretValue,
} from "@/hooks/org/use-secrets";
import { cn } from "@/lib/display/utils";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface GroupedSecret {
	key: string;
	secretType: string | null;
	repos: Array<{ repoId: string | null; repoName: string | null }>;
}

interface SecretEditModalProps {
	secret: GroupedSecret | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function SecretEditModal({ secret, open, onOpenChange }: SecretEditModalProps) {
	const { data: allRepos } = useRepos();
	const assignToRepos = useAssignSecretToRepos();
	const updateValue = useUpdateSecretValue();
	const removeFromRepos = useRemoveSecretFromRepos();

	const [selectedRepoIds, setSelectedRepoIds] = useState<Set<string>>(new Set());
	const [newValue, setNewValue] = useState("");
	const [error, setError] = useState("");

	// Initialize selected repos from current secret
	useEffect(() => {
		if (secret && open) {
			const ids = new Set<string>();
			for (const r of secret.repos) {
				if (r.repoId) ids.add(r.repoId);
			}
			setSelectedRepoIds(ids);
			setNewValue("");
			setError("");
		}
	}, [secret, open]);

	const originalRepoIds = useMemo(() => {
		if (!secret) return new Set<string>();
		const ids = new Set<string>();
		for (const r of secret.repos) {
			if (r.repoId) ids.add(r.repoId);
		}
		return ids;
	}, [secret]);

	const toggleRepo = (repoId: string) => {
		setSelectedRepoIds((prev) => {
			const next = new Set(prev);
			if (next.has(repoId)) {
				next.delete(repoId);
			} else {
				next.add(repoId);
			}
			return next;
		});
	};

	const handleSave = async () => {
		if (!secret) return;
		setError("");

		try {
			// Determine added and removed repos
			const addedRepoIds = [...selectedRepoIds].filter((id) => !originalRepoIds.has(id));
			const removedRepoIds = [...originalRepoIds].filter((id) => !selectedRepoIds.has(id));

			// Update value if provided
			if (newValue.trim() && selectedRepoIds.size > 0) {
				await updateValue.mutateAsync({
					key: secret.key,
					newValue: newValue.trim(),
					repoIds: [...selectedRepoIds],
				});
			}

			// Assign to new repos (needs a value — use newValue or prompt)
			if (addedRepoIds.length > 0) {
				if (!newValue.trim()) {
					setError("Enter a value to assign this secret to new repositories.");
					return;
				}
				await assignToRepos.mutateAsync({
					key: secret.key,
					value: newValue.trim(),
					repoIds: addedRepoIds,
				});
			}

			// Remove from repos
			if (removedRepoIds.length > 0) {
				await removeFromRepos.mutateAsync({
					key: secret.key,
					repoIds: removedRepoIds,
				});
			}

			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update secret");
		}
	};

	const isPending = assignToRepos.isPending || updateValue.isPending || removeFromRepos.isPending;
	const hasChanges =
		newValue.trim() !== "" ||
		[...selectedRepoIds].some((id) => !originalRepoIds.has(id)) ||
		[...originalRepoIds].some((id) => !selectedRepoIds.has(id));

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-mono text-sm">{secret?.key}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{/* New value */}
					<div className="space-y-2">
						<Label className="text-xs">New Value</Label>
						<Input
							value={newValue}
							onChange={(e) => setNewValue(e.target.value)}
							placeholder="Leave empty to keep current value"
							type="password"
							className="h-8 text-sm"
						/>
					</div>

					{/* Repo assignment */}
					<div className="space-y-2">
						<Label className="text-xs">Repositories</Label>
						<div className="rounded-lg border border-border max-h-48 overflow-y-auto">
							{(allRepos ?? []).length === 0 ? (
								<p className="text-xs text-muted-foreground p-3">No repositories available</p>
							) : (
								(allRepos ?? []).map((repo) => {
									const selected = selectedRepoIds.has(repo.id);
									return (
										<button
											key={repo.id}
											type="button"
											onClick={() => toggleRepo(repo.id)}
											className={cn(
												"flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0",
												selected && "bg-muted/30",
											)}
										>
											<div
												className={cn(
													"h-4 w-4 rounded border flex items-center justify-center shrink-0",
													selected
														? "bg-primary border-primary text-primary-foreground"
														: "border-border",
												)}
											>
												{selected && <Check className="h-3 w-3" />}
											</div>
											<span className="truncate">{repo.githubRepoName}</span>
										</button>
									);
								})
							)}
						</div>
					</div>

					{/* Org-wide indicator */}
					{secret?.repos.some((r) => !r.repoId) && (
						<p className="text-xs text-muted-foreground">
							This secret also has an org-wide assignment (applies to all repositories).
						</p>
					)}

					{error && <p className="text-xs text-destructive">{error}</p>}
				</div>

				<DialogFooter>
					<Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button size="sm" onClick={handleSave} disabled={isPending || !hasChanges}>
						{isPending ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
