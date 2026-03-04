"use client";

import { orpc } from "@/lib/orpc";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function useOnboardingComplete() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [error, setError] = useState<string | null>(null);
	const hasStarted = useRef(false);

	const markCompleteMutation = useMutation(orpc.onboarding.markComplete.mutationOptions());

	useEffect(() => {
		if (hasStarted.current) return;
		hasStarted.current = true;

		async function completeSetup() {
			try {
				await markCompleteMutation.mutateAsync({});

				const returnTo = searchParams.get("return");
				if (returnTo) {
					router.replace(returnTo);
				} else {
					router.replace("/onboarding?success=billing");
				}
			} catch {
				setError("Failed to complete setup. Please try again.");
			}
		}

		completeSetup();
	}, [router, markCompleteMutation, searchParams]);

	return { error };
}
