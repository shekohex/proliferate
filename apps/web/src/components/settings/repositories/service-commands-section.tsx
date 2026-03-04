"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useServiceCommandsEditor } from "@/hooks/settings/use-service-commands-editor";
import { Pencil, Plus, Trash2 } from "lucide-react";

export function ServiceCommandsSection({ repoId }: { repoId: string }) {
	const {
		commands,
		isLoading,
		editing,
		drafts,
		isSaving,
		startEditing,
		cancelEditing,
		handleSave,
		addRow,
		removeRow,
		updateDraft,
	} = useServiceCommandsEditor(repoId);

	if (isLoading) {
		return (
			<section>
				<h2 className="text-sm font-medium mb-3">Auto-start Commands</h2>
				<LoadingDots size="sm" className="text-muted-foreground" />
			</section>
		);
	}

	return (
		<section>
			<div className="flex items-center justify-between mb-3">
				<h2 className="text-sm font-medium">Auto-start Commands</h2>
				{!editing && (
					<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={startEditing}>
						<Pencil className="h-3 w-3 mr-1" />
						{commands && commands.length > 0 ? "Edit" : "Add commands"}
					</Button>
				)}
			</div>

			{editing ? (
				<div className="space-y-2">
					<p className="text-xs text-muted-foreground">
						Default auto-start commands. Run automatically when a session starts.
					</p>
					{drafts.map((draft, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: draft list keyed by position
						<div key={index} className="flex items-start gap-2">
							<div className="flex-1 space-y-1.5">
								<Input
									value={draft.name}
									onChange={(e) => updateDraft(index, "name", e.target.value)}
									placeholder="Name (e.g. dev-server)"
									className="h-7 text-xs"
								/>
								<Input
									value={draft.command}
									onChange={(e) => updateDraft(index, "command", e.target.value)}
									placeholder="Command (e.g. pnpm dev)"
									className="h-7 text-xs font-mono"
								/>
								<Input
									value={draft.cwd}
									onChange={(e) => updateDraft(index, "cwd", e.target.value)}
									placeholder="Working directory (optional)"
									className="h-7 text-xs"
								/>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
								onClick={() => removeRow(index)}
							>
								<Trash2 className="h-3.5 w-3.5" />
							</Button>
						</div>
					))}
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							className="h-7 text-xs"
							onClick={addRow}
							disabled={drafts.length >= 10}
						>
							<Plus className="h-3 w-3 mr-1" />
							Add command
						</Button>
						<div className="flex-1" />
						<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={cancelEditing}>
							Cancel
						</Button>
						<Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={isSaving}>
							{isSaving ? "Saving..." : "Save"}
						</Button>
					</div>
				</div>
			) : commands && commands.length > 0 ? (
				<div className="rounded-lg border border-border/80 bg-background p-3">
					<div className="space-y-1">
						{commands.map((cmd, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: display-only list
							<div key={index} className="text-xs py-0.5">
								<span className="font-medium">{cmd.name}</span>
								<span className="text-muted-foreground ml-2 font-mono">{cmd.command}</span>
								{cmd.cwd && <span className="text-muted-foreground ml-2">({cmd.cwd})</span>}
							</div>
						))}
					</div>
				</div>
			) : (
				<div className="rounded-lg border border-dashed border-border/80 py-6 text-center">
					<p className="text-sm text-muted-foreground">No auto-start commands configured</p>
				</div>
			)}
		</section>
	);
}
