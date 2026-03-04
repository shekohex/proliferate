"use client";

import { useCreateSecret, useDeleteSecret, useSecrets } from "@/hooks/use-secrets";
import { useState } from "react";

export function useSecretsForm() {
	const [isAdding, setIsAdding] = useState(false);
	const [newKey, setNewKey] = useState("");
	const [newValue, setNewValue] = useState("");
	const [newDescription, setNewDescription] = useState("");
	const [showValue, setShowValue] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const { data: secrets, isLoading } = useSecrets();
	const createSecret = useCreateSecret();
	const deleteSecret = useDeleteSecret();

	const resetForm = () => {
		setIsAdding(false);
		setNewKey("");
		setNewValue("");
		setNewDescription("");
		setShowValue(false);
		setError(null);
	};

	const handleAdd = async () => {
		if (!newKey.trim() || !newValue.trim()) {
			setError("Key and value are required");
			return;
		}

		setError(null);

		try {
			await createSecret.mutateAsync({
				key: newKey.trim(),
				value: newValue.trim(),
				description: newDescription.trim() || undefined,
			});
			resetForm();
		} catch {
			setError("Failed to create secret");
		}
	};

	const handleDelete = async (id: string) => {
		setDeletingId(id);
		try {
			await deleteSecret.mutateAsync(id);
		} finally {
			setDeletingId(null);
		}
	};

	return {
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
		isCreating: createSecret.isPending,
		deletingId,
		resetForm,
		handleAdd,
		handleDelete,
	};
}
