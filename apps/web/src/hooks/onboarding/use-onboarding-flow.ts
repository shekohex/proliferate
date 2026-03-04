"use client";

import { useOnboarding } from "@/hooks/use-onboarding";
import { orpc } from "@/lib/orpc";
import { type FlowType, useOnboardingStore } from "@/stores/onboarding";
import { env } from "@proliferate/environment/public";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function useOnboardingFlow() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { refetch } = useOnboarding();
	const billingEnabled = env.NEXT_PUBLIC_BILLING_ENABLED;

	const flowType = useOnboardingStore((state) => state.flowType);
	const step = useOnboardingStore((state) => state.step);
	const setFlowType = useOnboardingStore((state) => state.setFlowType);
	const setStep = useOnboardingStore((state) => state.setStep);
	const reset = useOnboardingStore((state) => state.reset);

	// Handle billing success callback
	useEffect(() => {
		if (searchParams.get("success") === "billing") {
			refetch();
			setStep("complete");
			window.history.replaceState({}, "", "/onboarding");
		}
	}, [searchParams, refetch, setStep]);

	// If billing is disabled, skip the billing step
	useEffect(() => {
		if (!billingEnabled && step === "billing") {
			refetch();
			setStep("complete");
		}
	}, [billingEnabled, step, refetch, setStep]);

	const saveToolsMutation = useMutation({
		...orpc.onboarding.saveToolSelections.mutationOptions(),
	});

	const saveQuestionnaireMutation = useMutation({
		...orpc.onboarding.saveQuestionnaire.mutationOptions(),
	});

	const markCompleteMutation = useMutation({
		...orpc.onboarding.markComplete.mutationOptions(),
	});

	const handlePathSelect = (type: FlowType) => {
		setFlowType(type);
		if (type === "developer") {
			setStep("tools");
		} else {
			setStep("create-org");
		}
	};

	const handleOrgCreated = () => {
		setStep("questionnaire");
	};

	const handleQuestionnaireComplete = (data: {
		referralSource?: string;
		companyWebsite?: string;
		teamSize?: string;
	}) => {
		saveQuestionnaireMutation.mutate(data, {
			onSettled: () => {
				setStep("tools");
			},
		});
	};

	const handleToolsComplete = (selectedTools: string[]) => {
		saveToolsMutation.mutate(
			{ selectedTools },
			{
				onSettled: () => {
					if (flowType === "organization") {
						setStep("invite");
					} else if (billingEnabled) {
						setStep("billing");
					} else {
						setStep("complete");
					}
				},
			},
		);
	};

	const handleInviteComplete = () => {
		if (billingEnabled) {
			setStep("billing");
		} else {
			setStep("complete");
		}
	};

	const handleBillingComplete = () => {
		refetch();
		setStep("complete");
	};

	const handleFinish = () => {
		markCompleteMutation.mutate(undefined, {
			onSuccess: async () => {
				await refetch();
				router.push("/dashboard");
				reset();
			},
		});
	};

	return {
		step,
		flowType,
		billingEnabled,
		saveToolsMutation,
		saveQuestionnaireMutation,
		markCompleteMutation,
		handlePathSelect,
		handleOrgCreated,
		handleQuestionnaireComplete,
		handleToolsComplete,
		handleInviteComplete,
		handleBillingComplete,
		handleFinish,
	};
}
