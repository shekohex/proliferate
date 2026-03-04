"use client";

import {
	useCreateOrgConnector,
	useDeleteOrgConnector,
	useOrgConnectors,
	useUpdateOrgConnector,
} from "@/hooks/use-org-connectors";
import type { ConnectorConfig } from "@proliferate/shared";
import { useCallback, useState } from "react";

export function useIntegrationActions() {
	const [editingId, setEditingId] = useState<string | null>(null);

	const { data: connectors, isLoading: connectorsLoading } = useOrgConnectors();
	const createMutation = useCreateOrgConnector();
	const updateMutation = useUpdateOrgConnector();
	const deleteMutation = useDeleteOrgConnector();

	const handleRemove = useCallback(
		async (id: string) => {
			await deleteMutation.mutateAsync({ id });
		},
		[deleteMutation],
	);

	const handleToggle = useCallback(
		async (connector: ConnectorConfig) => {
			await updateMutation.mutateAsync({
				id: connector.id,
				enabled: !connector.enabled,
			});
		},
		[updateMutation],
	);

	const handleSave = useCallback(
		async (connector: ConnectorConfig, isNew: boolean) => {
			if (isNew) {
				await createMutation.mutateAsync({
					name: connector.name,
					transport: connector.transport,
					url: connector.url,
					auth: connector.auth,
					riskPolicy: connector.riskPolicy,
					enabled: connector.enabled,
				});
			} else {
				await updateMutation.mutateAsync({
					id: connector.id,
					name: connector.name,
					url: connector.url,
					auth: connector.auth,
					riskPolicy: connector.riskPolicy,
					enabled: connector.enabled,
				});
			}
			setEditingId(null);
		},
		[createMutation, updateMutation],
	);

	return {
		connectors,
		connectorsLoading,
		editingId,
		setEditingId,
		updateMutationIsPending: updateMutation.isPending,
		handleRemove,
		handleToggle,
		handleSave,
	};
}
