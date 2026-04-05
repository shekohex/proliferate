"use client";

import { orpc } from "@/lib/infra/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCoderProviderSettings() {
	return useQuery({
		...orpc.coderProvider.getSettings.queryOptions(),
	});
}

export function useCoderTemplate(templateId: string | null, enabled = true) {
	return useQuery({
		...orpc.coderProvider.getTemplate.queryOptions({ input: { templateId: templateId ?? "" } }),
		enabled: enabled && Boolean(templateId),
	});
}

export function useUpdateCoderProviderSettings() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.coderProvider.updateSettings.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpc.coderProvider.getSettings.key() });
			},
		}),
	);
}
