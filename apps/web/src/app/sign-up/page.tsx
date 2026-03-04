"use client";

import { AuthLayout } from "@/components/auth/auth-layout";
import { SignUpContent } from "@/components/auth/sign-up-content";
import { Suspense } from "react";

export default function SignUpPage() {
	return (
		<Suspense
			fallback={
				<AuthLayout>
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-muted-foreground" />
				</AuthLayout>
			}
		>
			<SignUpContent />
		</Suspense>
	);
}
