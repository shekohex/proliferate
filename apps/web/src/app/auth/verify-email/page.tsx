"use client";

import { AuthLayout } from "@/components/auth/auth-layout";
import { VerifyEmailContent } from "@/components/auth/verify-email-content";
import { Suspense } from "react";

export default function VerifyEmailPage() {
	return (
		<Suspense
			fallback={
				<AuthLayout>
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
				</AuthLayout>
			}
		>
			<VerifyEmailContent />
		</Suspense>
	);
}
