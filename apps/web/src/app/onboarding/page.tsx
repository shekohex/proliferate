"use client";

import { StepBilling } from "@/components/onboarding/step-billing";
import { StepComplete } from "@/components/onboarding/step-complete";
import { StepCreateOrg } from "@/components/onboarding/step-create-org";
import { StepInviteMembers } from "@/components/onboarding/step-invite-members";
import { StepPathChoice } from "@/components/onboarding/step-path-choice";
import { StepQuestionnaire } from "@/components/onboarding/step-questionnaire";
import { StepToolSelection } from "@/components/onboarding/step-tool-selection";
import { useOnboardingFlow } from "@/hooks/onboarding/use-onboarding-flow";

export default function OnboardingPage() {
	const {
		step,
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
	} = useOnboardingFlow();

	if (markCompleteMutation.isSuccess) {
		return null;
	}

	return (
		<div key={step} className="animate-in fade-in duration-300">
			{step === "path" && <StepPathChoice onSelect={handlePathSelect} />}
			{step === "create-org" && <StepCreateOrg onComplete={handleOrgCreated} />}
			{step === "questionnaire" && (
				<StepQuestionnaire
					onComplete={handleQuestionnaireComplete}
					isSubmitting={saveQuestionnaireMutation.isPending}
				/>
			)}
			{step === "tools" && (
				<StepToolSelection
					onComplete={handleToolsComplete}
					isSubmitting={saveToolsMutation.isPending}
				/>
			)}
			{step === "invite" && <StepInviteMembers onComplete={handleInviteComplete} />}
			{step === "billing" && billingEnabled && <StepBilling onComplete={handleBillingComplete} />}
			{step === "complete" && (
				<StepComplete
					onComplete={handleFinish}
					isSubmitting={markCompleteMutation.isPending}
					error={markCompleteMutation.error?.message}
				/>
			)}
		</div>
	);
}
