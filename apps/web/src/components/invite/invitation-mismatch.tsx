"use client";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { LogOut, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface InvitationMismatchProps {
	organizationName: string;
	invitedEmail: string;
	currentEmail: string;
	signingOut: boolean;
	onSignOutAndRetry: () => void;
}

export function InvitationMismatch({
	organizationName,
	invitedEmail,
	currentEmail,
	signingOut,
	onSignOutAndRetry,
}: InvitationMismatchProps) {
	const router = useRouter();

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="w-full max-w-md p-8">
				<div className="mb-8 text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
						<Users className="h-8 w-8 text-muted-foreground" />
					</div>
					<Text variant="h3" className="mb-2">
						Account Mismatch
					</Text>
					<Text variant="body" color="muted">
						You were taken here through an invitation to join{" "}
						<Text as="span" className="font-medium text-foreground">
							{organizationName}
						</Text>
						, but it was sent to{" "}
						<Text as="span" className="font-medium text-foreground">
							{invitedEmail}
						</Text>
						, not{" "}
						<Text as="span" className="font-medium text-foreground">
							{currentEmail}
						</Text>
						.
					</Text>
				</div>

				<div className="flex flex-col gap-3">
					<Button onClick={onSignOutAndRetry} disabled={signingOut} className="w-full">
						<LogOut className="mr-2 h-4 w-4" />
						{signingOut ? "Signing out..." : `Sign in as ${invitedEmail}`}
					</Button>
					<Button variant="outline" onClick={() => router.push("/onboarding")} className="w-full">
						Continue with my account
					</Button>
				</div>
			</div>
		</div>
	);
}
