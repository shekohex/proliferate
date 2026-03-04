"use client";

import { DeviceGitHubContent } from "@/components/device/device-github-content";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export default function DeviceGitHubPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-background">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<DeviceGitHubContent />
		</Suspense>
	);
}
