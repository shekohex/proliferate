"use client";

import { useServiceCommands, useUpdateServiceCommands } from "@/hooks/use-repos";
import { useState } from "react";

export interface CommandDraft {
	name: string;
	command: string;
	cwd: string;
}

export function useServiceCommandsEditor(repoId: string) {
	const { data: commands, isLoading } = useServiceCommands(repoId);
	const updateCommands = useUpdateServiceCommands();
	const [editing, setEditing] = useState(false);
	const [drafts, setDrafts] = useState<CommandDraft[]>([]);

	const startEditing = () => {
		setDrafts(
			commands?.length
				? commands.map((c) => ({ name: c.name, command: c.command, cwd: c.cwd || "" }))
				: [{ name: "", command: "", cwd: "" }],
		);
		setEditing(true);
	};

	const cancelEditing = () => {
		setEditing(false);
	};

	const handleSave = async () => {
		const valid = drafts.filter((d) => d.name.trim() && d.command.trim());
		await updateCommands.mutateAsync({
			id: repoId,
			commands: valid.map((d) => ({
				name: d.name.trim(),
				command: d.command.trim(),
				...(d.cwd.trim() ? { cwd: d.cwd.trim() } : {}),
			})),
		});
		setEditing(false);
	};

	const addRow = () => {
		if (drafts.length >= 10) return;
		setDrafts([...drafts, { name: "", command: "", cwd: "" }]);
	};

	const removeRow = (index: number) => {
		setDrafts(drafts.filter((_, i) => i !== index));
	};

	const updateDraft = (index: number, field: keyof CommandDraft, value: string) => {
		setDrafts(drafts.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
	};

	return {
		commands,
		isLoading,
		editing,
		drafts,
		isSaving: updateCommands.isPending,
		startEditing,
		cancelEditing,
		handleSave,
		addRow,
		removeRow,
		updateDraft,
	};
}
