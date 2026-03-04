"use client";

import { PageShell } from "@/components/dashboard/page-shell";
import { DangerZoneSection, WorkspaceSection } from "@/components/settings/general";
import { useCurrentUserRole } from "@/hooks/org/use-current-user-role";
import { useActiveOrganization } from "@/lib/auth/client";

export default function GeneralPage() {
	const { data: activeOrg, isPending: isActiveOrgPending } = useActiveOrganization();
	const { isOwner } = useCurrentUserRole();

	if (isActiveOrgPending || !activeOrg) {
		return (
			<PageShell title="General" subtitle="Workspace configuration" maxWidth="2xl">
				<div className="space-y-4">
					{[1, 2].map((i) => (
						<div key={i} className="h-24 rounded-lg bg-muted/30 animate-pulse" />
					))}
				</div>
			</PageShell>
		);
	}

	return (
		<PageShell title="General" subtitle="Workspace configuration" maxWidth="2xl">
			<div className="space-y-10">
				<WorkspaceSection activeOrg={activeOrg} isOwner={isOwner} />
				{isOwner && <DangerZoneSection organizationName={activeOrg.name} />}
			</div>
		</PageShell>
	);
}
