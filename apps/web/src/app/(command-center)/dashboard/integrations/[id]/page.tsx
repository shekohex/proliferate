"use client";

import { ConnectorConnectionTab } from "@/components/integrations/connector-connection-tab";
import { ConnectorIcon } from "@/components/integrations/connector-icon";
import { OAuthConnectionTab } from "@/components/integrations/oauth-connection-tab";
import { PermissionsTab } from "@/components/integrations/permissions-tab";
import { ProviderIcon, getProviderDisplayName } from "@/components/integrations/provider-icon";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import type { IntegrationTab } from "@/config/integrations";
import { useIntegrations } from "@/hooks/use-integrations";
import { getProviderFromIntegrationId } from "@/hooks/use-nango-connect";
import { useOrgConnectors } from "@/hooks/use-org-connectors";
import { cn } from "@/lib/utils";
import { ArrowLeft, Shield } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function IntegrationDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const id = params.id;
	const [activeTab, setActiveTab] = useState<IntegrationTab>("connection");

	const { data: integrationsData, isLoading: integrationsLoading } = useIntegrations();
	const { data: connectors, isLoading: connectorsLoading } = useOrgConnectors();

	const isLoading = integrationsLoading || connectorsLoading;

	const integration = integrationsData?.integrations?.find((i) => i.id === id);
	const connector = connectors?.find((c) => c.id === id);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<LoadingDots size="md" className="text-muted-foreground" />
			</div>
		);
	}

	if (!integration && !connector) {
		return (
			<div className="mx-auto max-w-3xl px-6 py-8">
				<p className="text-sm text-muted-foreground">Integration not found.</p>
				<Button
					variant="ghost"
					size="sm"
					className="mt-2"
					onClick={() => router.push("/dashboard/integrations")}
				>
					<ArrowLeft className="h-4 w-4 mr-1" />
					Back to integrations
				</Button>
			</div>
		);
	}

	const isOAuth = !!integration;
	const provider =
		isOAuth && integration.integration_id
			? getProviderFromIntegrationId(integration.integration_id)
			: null;
	const displayName =
		isOAuth && provider ? getProviderDisplayName(provider) : (connector?.name ?? "Integration");

	return (
		<div className="h-full overflow-y-auto">
			<div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
				{/* Header */}
				<div>
					<Button
						variant="ghost"
						size="sm"
						className="text-xs text-muted-foreground mb-3 -ml-2 h-auto py-1 px-2"
						onClick={() => router.push("/dashboard/integrations")}
					>
						<ArrowLeft className="h-3 w-3 mr-1" />
						Integrations
					</Button>
					<div className="flex items-center gap-3">
						{isOAuth && provider ? (
							<ProviderIcon provider={provider} size="md" />
						) : connector ? (
							<ConnectorIcon presetKey={connector.name.toLowerCase()} size="md" />
						) : null}
						<h1 className="text-lg font-semibold">{displayName}</h1>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex gap-1 border-b border-border">
					<Button
						variant="ghost"
						size="sm"
						className={cn(
							"rounded-none border-b-2 -mb-px h-auto py-2 px-3 text-sm font-medium",
							activeTab === "connection"
								? "border-primary text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground",
						)}
						onClick={() => setActiveTab("connection")}
					>
						Connection
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className={cn(
							"rounded-none border-b-2 -mb-px h-auto py-2 px-3 text-sm font-medium",
							activeTab === "permissions"
								? "border-primary text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground",
						)}
						onClick={() => setActiveTab("permissions")}
					>
						<Shield className="h-3.5 w-3.5 mr-1.5" />
						Agent Permissions
					</Button>
				</div>

				{/* Tab content */}
				{activeTab === "connection" ? (
					isOAuth && provider ? (
						<OAuthConnectionTab integrationId={id} provider={provider} />
					) : connector ? (
						<ConnectorConnectionTab connector={connector} />
					) : null
				) : (
					<PermissionsTab isOAuth={isOAuth} provider={provider} connectorId={connector?.id} />
				)}
			</div>
		</div>
	);
}
