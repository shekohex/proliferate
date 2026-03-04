"use client";

import { ConnectorForm } from "@/components/integrations/connector-form";
import { Button } from "@/components/ui/button";
import { useUpdateOrgConnector } from "@/hooks/use-org-connectors";
import { cn } from "@/lib/utils";
import type { ConnectorConfig } from "@proliferate/shared";
import { useState } from "react";

interface ConnectorConnectionTabProps {
	connector: ConnectorConfig;
}

export function ConnectorConnectionTab({ connector }: ConnectorConnectionTabProps) {
	const updateMutation = useUpdateOrgConnector();
	const [editing, setEditing] = useState(false);

	const handleSave = async (updated: ConnectorConfig) => {
		await updateMutation.mutateAsync({
			id: connector.id,
			name: updated.name,
			url: updated.url,
			auth: updated.auth,
			riskPolicy: updated.riskPolicy,
			enabled: updated.enabled,
		});
		setEditing(false);
	};

	const handleToggle = async () => {
		await updateMutation.mutateAsync({ id: connector.id, enabled: !connector.enabled });
	};

	return (
		<div className="space-y-4">
			{editing ? (
				<div className="rounded-lg border border-border/80 bg-background">
					<ConnectorForm
						initial={connector}
						isNew={false}
						onSave={handleSave}
						onCancel={() => setEditing(false)}
					/>
				</div>
			) : (
				<div className="rounded-lg border border-border/80 bg-background p-4 space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium">{connector.name}</h3>
						<div className="flex items-center gap-2">
							<span
								className={cn(
									"text-xs",
									connector.enabled ? "text-success" : "text-muted-foreground",
								)}
							>
								{connector.enabled ? "Enabled" : "Disabled"}
							</span>
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs"
								onClick={handleToggle}
								disabled={updateMutation.isPending}
							>
								{connector.enabled ? "Disable" : "Enable"}
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs"
								onClick={() => setEditing(true)}
							>
								Edit
							</Button>
						</div>
					</div>
					<div className="text-xs text-muted-foreground space-y-1">
						<p>
							URL: <code>{connector.url}</code>
						</p>
						<p>Transport: {connector.transport}</p>
					</div>
				</div>
			)}
		</div>
	);
}
