"use client";

import { PermissionControl } from "@/components/integrations/permission-control";
import type { Provider } from "@/components/integrations/provider-icon";
import { useActionModes, useSetActionMode } from "@/hooks/use-action-modes";
import { ACTION_ADAPTERS, type ActionMeta } from "@/lib/action-adapters";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

interface PermissionsTabProps {
	isOAuth: boolean;
	provider: Provider | null;
	connectorId?: string;
}

export function PermissionsTab({ isOAuth, provider, connectorId }: PermissionsTabProps) {
	const { data: modesData } = useActionModes();
	const setActionMode = useSetActionMode();
	const modes = modesData?.modes ?? {};

	let actions: { key: string; name: string; description: string; riskLevel: string }[] = [];

	if (isOAuth && provider) {
		const adapter = ACTION_ADAPTERS.find((a) => a.integration === provider);
		if (adapter) {
			actions = adapter.actions.map((action: ActionMeta) => ({
				key: `${provider}:${action.name}`,
				name: action.name,
				description: action.description,
				riskLevel: action.riskLevel,
			}));
		}
	}

	if (actions.length === 0 && !connectorId) {
		return (
			<div className="rounded-lg border border-dashed border-border/80 py-8 text-center">
				<Shield className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
				<p className="text-sm text-muted-foreground">No actions available for this integration.</p>
			</div>
		);
	}

	if (actions.length === 0 && connectorId) {
		return (
			<div className="rounded-lg border border-dashed border-border/80 py-8 text-center">
				<Shield className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
				<p className="text-sm text-muted-foreground">
					Tool permissions for custom connectors will be available when agents discover tools at
					runtime.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<p className="text-sm text-muted-foreground">
				Control what your agents can do with this integration. Changes apply to all sessions.
			</p>
			<div className="rounded-lg border border-border/80 bg-background divide-y divide-border/60">
				{actions.map((action) => {
					const currentMode = modes[action.key] ?? "require_approval";
					return (
						<div key={action.key} className="flex items-center justify-between px-4 py-3">
							<div className="min-w-0 flex-1 mr-4">
								<p className="text-sm font-medium">{action.name}</p>
								<p className="text-xs text-muted-foreground">{action.description}</p>
								<span
									className={cn(
										"inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
										action.riskLevel === "write"
											? "border-warning/30 text-warning bg-warning/10"
											: "border-border text-muted-foreground",
									)}
								>
									{action.riskLevel}
								</span>
							</div>
							<PermissionControl
								value={currentMode}
								onChange={(mode) => setActionMode.mutate({ key: action.key, mode })}
								disabled={setActionMode.isPending}
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
}
