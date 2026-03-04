"use client";

import { useCreateConfiguration } from "@/hooks/use-configurations";
import { useCreateSession as useCreateSessionMutation } from "@/hooks/use-sessions";
import { useCallback, useEffect, useRef } from "react";

interface UseCreateSessionFromRepoOptions {
	repoId: string | null;
	sessionType: "setup" | "coding";
	modelId: string | undefined;
}

interface UseCreateSessionFromRepoResult {
	isPending: boolean;
	isSuccess: boolean;
	isError: boolean;
	errorMessage: string | undefined;
	stage: "preparing" | "provisioning";
	retry: () => void;
	/** Kicks off creation; returns sessionId on success, undefined on failure. */
	create: () => Promise<string | undefined>;
}

export function useCreateSessionFromRepo({
	repoId,
	sessionType,
	modelId,
}: UseCreateSessionFromRepoOptions): UseCreateSessionFromRepoResult {
	const creationStartedRef = useRef(false);

	const createConfiguration = useCreateConfiguration();
	const createSession = useCreateSessionMutation();

	const isPending = createConfiguration.isPending || createSession.isPending;
	const isSuccess = createSession.isSuccess;
	const isError = createConfiguration.isError || createSession.isError;
	const errorMessage =
		(createConfiguration.error ?? createSession.error)?.message ??
		(isError ? "Failed to create session" : undefined);

	const stage: "preparing" | "provisioning" = createSession.isPending
		? "provisioning"
		: "preparing";

	const retry = useCallback(() => {
		creationStartedRef.current = false;
		createConfiguration.reset();
		createSession.reset();
	}, [createConfiguration, createSession]);

	// Reset guard on error so retry works
	useEffect(() => {
		if (isError) {
			creationStartedRef.current = false;
		}
	}, [isError]);

	const create = useCallback(async (): Promise<string | undefined> => {
		if (!repoId || creationStartedRef.current || isPending || isSuccess) {
			return undefined;
		}

		creationStartedRef.current = true;
		try {
			const configurationResult = await createConfiguration.mutateAsync({
				repoIds: [repoId],
			});

			const sessionResult = await createSession.mutateAsync({
				configurationId: configurationResult.configurationId,
				sessionType,
				modelId,
			});

			return sessionResult.sessionId;
		} catch {
			creationStartedRef.current = false;
			return undefined;
		}
	}, [repoId, sessionType, modelId, isPending, isSuccess, createConfiguration, createSession]);

	return { isPending, isSuccess, isError, errorMessage, stage, retry, create };
}
