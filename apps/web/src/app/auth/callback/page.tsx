"use client";

import { CallbackHandler } from "@/components/auth/callback-handler";
import { Suspense } from "react";

export default function AuthCallbackPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-background">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
				</div>
			}
		>
			<CallbackHandler />
		</Suspense>
	);
}
