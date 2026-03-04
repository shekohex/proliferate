"use client";

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
import { useDeleteRepo } from "@/hooks/use-repos";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DangerSection({ repoId, repoName }: { repoId: string; repoName: string }) {
	const deleteRepo = useDeleteRepo();
	const router = useRouter();
	const [deleteOpen, setDeleteOpen] = useState(false);

	const handleDelete = async () => {
		await deleteRepo.mutateAsync({ id: repoId });
		router.push("/settings/repositories");
	};

	return (
		<section>
			<h2 className="text-sm font-medium mb-3">Danger Zone</h2>
			<div className="rounded-lg border border-destructive/30 bg-background p-4">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium">Delete repository</p>
						<p className="text-xs text-muted-foreground mt-0.5">
							Remove this repository and all its baselines from the organization.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
						onClick={() => setDeleteOpen(true)}
					>
						Delete
					</Button>
				</div>
			</div>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete repository</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove {repoName}? This will delete all baselines and targets
							associated with this repository.
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
		</section>
	);
}
