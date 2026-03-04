"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export function AddSecretForm({
	newKey,
	setNewKey,
	newValue,
	setNewValue,
	newDescription,
	setNewDescription,
	showValue,
	setShowValue,
	error,
	isCreating,
	onSubmit,
	onCancel,
}: {
	newKey: string;
	setNewKey: (v: string) => void;
	newValue: string;
	setNewValue: (v: string) => void;
	newDescription: string;
	setNewDescription: (v: string) => void;
	showValue: boolean;
	setShowValue: (v: boolean) => void;
	error: string | null;
	isCreating: boolean;
	onSubmit: () => void;
	onCancel: () => void;
}) {
	return (
		<div className="rounded-lg border border-border/80 bg-background p-4 space-y-4">
			<div className="space-y-2">
				<Label htmlFor="key">Key</Label>
				<Input
					id="key"
					placeholder="e.g., API_KEY"
					value={newKey}
					onChange={(e) => setNewKey(e.target.value.toUpperCase())}
					autoFocus
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="value">Value</Label>
				<div className="relative">
					<Input
						id="value"
						type={showValue ? "text" : "password"}
						placeholder="Enter secret value"
						value={newValue}
						onChange={(e) => setNewValue(e.target.value)}
						className="pr-10"
					/>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
						onClick={() => setShowValue(!showValue)}
					>
						{showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
					</Button>
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="description">Description (optional)</Label>
				<Input
					id="description"
					placeholder="What is this used for?"
					value={newDescription}
					onChange={(e) => setNewDescription(e.target.value)}
				/>
			</div>
			{error && <p className="text-sm text-destructive">{error}</p>}
			<div className="flex justify-end gap-2">
				<Button variant="outline" size="sm" onClick={onCancel}>
					Cancel
				</Button>
				<Button size="sm" onClick={onSubmit} disabled={isCreating}>
					{isCreating ? "Saving..." : "Add Secret"}
				</Button>
			</div>
		</div>
	);
}
