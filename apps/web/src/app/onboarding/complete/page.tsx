"use client";

import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Text } from "@/components/ui/text";
import { useOnboardingComplete } from "@/hooks/onboarding/use-onboarding-complete";
import { useRouter } from "next/navigation";

export default function OnboardingCompletePage() {
	const router = useRouter();
	const { error } = useOnboardingComplete();

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<Text variant="body" className="text-destructive mb-4">
						{error}
					</Text>
					<Button variant="link" onClick={() => router.push("/onboarding")} className="text-sm">
						Return to onboarding
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<LoadingDots size="lg" />
				<Text variant="body" color="muted" className="mt-4">
					Completing setup...
				</Text>
			</div>
		</div>
	);
}
