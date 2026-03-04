"use client";

import { PageShell } from "@/components/dashboard/page-shell";
import { AddSecretForm } from "@/components/settings/secrets/add-secret-form";
import { SecretsList } from "@/components/settings/secrets/secrets-list";
import { Button } from "@/components/ui/button";
import { useSecretsForm } from "@/hooks/settings/use-secrets-form";
import { Key, Plus } from "lucide-react";

export default function SecretsPage() {
	const {
		secrets,
		isLoading,
		isAdding,
		setIsAdding,
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
		deletingId,
		resetForm,
		handleAdd,
		handleDelete,
	} = useSecretsForm();

	if (isLoading) {
		return (
			<PageShell title="Secrets" subtitle="Encrypted environment variables" maxWidth="2xl">
				<div className="space-y-4">
					{[1, 2].map((i) => (
						<div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
					))}
				</div>
			</PageShell>
		);
	}

	return (
		<PageShell title="Secrets" subtitle="Encrypted environment variables" maxWidth="2xl">
			{isAdding ? (
				<AddSecretForm
					newKey={newKey}
					setNewKey={setNewKey}
					newValue={newValue}
					setNewValue={setNewValue}
					newDescription={newDescription}
					setNewDescription={setNewDescription}
					showValue={showValue}
					setShowValue={setShowValue}
					error={error}
					isCreating={isCreating}
					onSubmit={handleAdd}
					onCancel={resetForm}
				/>
			) : secrets && secrets.length > 0 ? (
				<SecretsList
					secrets={secrets}
					deletingId={deletingId}
					onDelete={handleDelete}
					onAdd={() => setIsAdding(true)}
				/>
			) : (
				<div className="rounded-lg border border-dashed border-border/80 bg-background py-8 text-center">
					<Key className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
					<p className="text-sm text-muted-foreground">No secrets yet</p>
					<p className="text-xs text-muted-foreground mt-1">
						Secrets are encrypted and injected as environment variables
					</p>
					<Button variant="outline" size="sm" className="mt-4" onClick={() => setIsAdding(true)}>
						<Plus className="h-4 w-4 mr-2" />
						Add Secret
					</Button>
				</div>
			)}
		</PageShell>
	);
}
