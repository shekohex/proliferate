"use client";

import { CodingSession } from "@/components/coding-session/coding-session";
import { CoworkerBanner } from "@/components/workspace/coworker-banner";
import { SessionStatusMessage } from "@/components/workspace/session-status-message";
import { useOrgSwitch } from "@/hooks/org/use-org-switch";
import { useMarkSessionViewed, useSessionData } from "@/hooks/use-sessions";
import { useDashboardStore } from "@/stores/dashboard";
import { useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";

export default function SessionDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const { setActiveSession, pendingPrompt, clearPendingPrompt } = useDashboardStore();
	const { data: sessionData } = useSessionData(id);
	useMarkSessionViewed(id);
	const searchParams = useSearchParams();
	const targetOrgId = searchParams.get("orgId");
	const runId = searchParams.get("runId");
	const fromCoworker = searchParams.get("from") === "coworker";
	const [showCoworkerBanner, setShowCoworkerBanner] = useState(fromCoworker && !runId);

	const buildRedirectUrl = useCallback(
		(orgId: string) => {
			const params = new URLSearchParams({ orgId });
			if (runId) params.set("runId", runId);
			return `/workspace/${id}?${params.toString()}`;
		},
		[id, runId],
	);

	const { isSwitching, isOrgPending, shouldSwitchOrg, switchError } = useOrgSwitch({
		targetOrgId,
		buildRedirectUrl,
	});

	// Sync active session ID with URL
	useEffect(() => {
		setActiveSession(id);
	}, [id, setActiveSession]);

	if (targetOrgId && (isOrgPending || shouldSwitchOrg || isSwitching)) {
		return <SessionStatusMessage message="Switching organization..." />;
	}

	if (switchError) {
		return <SessionStatusMessage message={switchError} variant="destructive" />;
	}

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			{showCoworkerBanner && <CoworkerBanner onDismiss={() => setShowCoworkerBanner(false)} />}
			<div className="flex-1 min-h-0 flex flex-col">
				<CodingSession
					sessionId={id}
					runId={runId ?? undefined}
					initialPrompt={pendingPrompt || sessionData?.initialPrompt || undefined}
					onError={(_error) => {
						clearPendingPrompt();
					}}
				/>
			</div>
		</div>
	);
}
