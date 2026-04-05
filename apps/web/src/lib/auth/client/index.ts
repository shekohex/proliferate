"use client";

import { env } from "@proliferate/environment/public";
import { nextPhase } from "@proliferate/environment/runtime";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

function getBaseURL() {
	if (typeof window !== "undefined") {
		// Client-side: use window.location.origin for full URL
		return `${window.location.origin}/api/auth`;
	}
	// Server-side module evaluation still needs an absolute URL in dev and prod.
	const isBuild = nextPhase === PHASE_PRODUCTION_BUILD;
	const appUrl = env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
	if (!isBuild && appUrl.startsWith("/")) {
		return `http://localhost:3000${appUrl}/api/auth`;
	}
	return `${appUrl}/api/auth`;
}

export const authClient = createAuthClient({
	baseURL: getBaseURL(),
	plugins: [organizationClient()],
});

export const {
	signIn,
	signUp,
	signOut,
	useSession,
	organization,
	useActiveOrganization,
	useListOrganizations,
	sendVerificationEmail,
} = authClient;
