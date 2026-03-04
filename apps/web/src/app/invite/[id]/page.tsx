"use client";

import { InvitationAccept } from "@/components/invite/invitation-accept";
import { InvitationError } from "@/components/invite/invitation-error";
import { InvitationLoading } from "@/components/invite/invitation-loading";
import { InvitationMismatch } from "@/components/invite/invitation-mismatch";
import { useInvitation } from "@/hooks/org/use-invitation";
import { useParams } from "next/navigation";

export default function InviteAcceptPage() {
	const params = useParams();
	const invitationId = params.id as string;

	const {
		session,
		sessionPending,
		invitation,
		invitedEmail,
		organizationName,
		basicInfoLoaded,
		error,
		accepting,
		rejecting,
		signingOut,
		handleAccept,
		handleReject,
		handleSignOutAndRetry,
	} = useInvitation(invitationId);

	if (!basicInfoLoaded || sessionPending) {
		return <InvitationLoading message="Loading invitation..." />;
	}

	if (error) {
		return <InvitationError message={error} />;
	}

	if (session && invitedEmail && session.user.email.toLowerCase() !== invitedEmail.toLowerCase()) {
		return (
			<InvitationMismatch
				organizationName={organizationName ?? ""}
				invitedEmail={invitedEmail}
				currentEmail={session.user.email}
				signingOut={signingOut}
				onSignOutAndRetry={handleSignOutAndRetry}
			/>
		);
	}

	if (!invitation) {
		return <InvitationLoading message="Loading invitation details..." />;
	}

	return (
		<InvitationAccept
			invitation={invitation}
			accepting={accepting}
			rejecting={rejecting}
			onAccept={handleAccept}
			onReject={handleReject}
		/>
	);
}
