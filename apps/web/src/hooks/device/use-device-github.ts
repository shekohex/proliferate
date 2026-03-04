"use client";

import { useSession } from "@/lib/auth/client";
import { orpc } from "@/lib/orpc";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export type SelectionState =
	| { type: "selecting"; pendingId: string | null }
	| { type: "confirming" }
	| { type: "connected"; connectionId: string }
	| { type: "local-git" };

export function useDeviceGitHub() {
	const { data: session, isPending: sessionLoading } = useSession();
	const searchParams = useSearchParams();
	const [selectionState, setSelectionState] = useState<SelectionState>({
		type: "selecting",
		pendingId: null,
	});

	const selectMutation = useMutation({
		...orpc.cli.github.select.mutationOptions(),
		onSuccess: (_, variables) => {
			if (variables.connectionId === "local-git") {
				setSelectionState({ type: "local-git" });
			} else {
				setSelectionState({ type: "connected", connectionId: variables.connectionId });
			}
		},
	});

	const cliOrgId = searchParams.get("orgId");

	// Handle callback with ?success=github (from GitHub App flow)
	useEffect(() => {
		if (searchParams.get("success") === "github") {
			window.history.replaceState({}, "", "/device-github");
		}
	}, [searchParams]);

	// Redirect to sign-in if not authenticated
	useEffect(() => {
		if (sessionLoading || session?.user) return;
		const returnUrl = encodeURIComponent("/device-github");
		window.location.href = `/sign-in?redirect=${returnUrl}`;
	}, [session, sessionLoading]);

	const handleConfirm = () => {
		if (selectionState.type === "selecting" && selectionState.pendingId) {
			setSelectionState({ type: "confirming" });
			selectMutation.mutate({ connectionId: selectionState.pendingId });
		}
	};

	const setPendingSelection = (connectionId: string) => {
		setSelectionState({ type: "selecting", pendingId: connectionId });
	};

	const isConfirming = selectionState.type === "confirming";
	const pendingId = selectionState.type === "selecting" ? selectionState.pendingId : null;

	return {
		session,
		sessionLoading,
		selectionState,
		cliOrgId,
		isConfirming,
		pendingId,
		handleConfirm,
		setPendingSelection,
	};
}
