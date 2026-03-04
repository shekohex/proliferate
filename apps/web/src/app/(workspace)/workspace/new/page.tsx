"use client";

import { SessionLoadingShell } from "@/components/coding-session/session-loading-shell";
import { SessionCreationError } from "@/components/workspace/session-creation-error";
import { useCreateSessionFromRepo } from "@/hooks/sessions/use-create-session";
import { useRepo } from "@/hooks/use-repos";
import { useDashboardStore } from "@/stores/dashboard";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function NewSessionPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { pendingPrompt, selectedModel } = useDashboardStore();

	const repoId = searchParams.get("repoId");
	const sessionType = (searchParams.get("type") as "setup" | "coding") || "coding";

	const { data: repo } = useRepo(repoId || "");

	const { isPending, isSuccess, isError, errorMessage, stage, retry, create } =
		useCreateSessionFromRepo({
			repoId,
			sessionType,
			modelId: selectedModel,
		});

	// Trigger creation once
	useEffect(() => {
		if (!repoId) {
			router.replace("/dashboard");
			return;
		}

		if (sessionType === "setup") {
			router.replace(`/workspace/setup/${repoId}`);
			return;
		}

		if (isPending || isSuccess) return;

		void (async () => {
			const sessionId = await create();
			if (sessionId) {
				router.replace(`/workspace/${sessionId}`);
			}
		})();
	}, [repoId, sessionType, isPending, isSuccess, router, create]);

	if (isError) {
		return (
			<SessionCreationError message={errorMessage ?? "Failed to create session"} onRetry={retry} />
		);
	}

	return (
		<SessionLoadingShell
			mode="creating"
			stage={stage}
			repoName={repo?.githubRepoName}
			initialPrompt={sessionType === "setup" ? pendingPrompt || undefined : undefined}
		/>
	);
}
