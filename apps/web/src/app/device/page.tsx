"use client";

import { DevicePageContent } from "@/components/device/device-page-content";
import { Suspense } from "react";

export default function DevicePage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-background">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
				</div>
			}
		>
			<DevicePageContent />
		</Suspense>
	);
}
