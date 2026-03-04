"use client";

import { SandboxContent } from "@/components/sandbox/sandbox-content";
import { Suspense } from "react";

export default function SandboxPage() {
	return (
		<Suspense fallback={<div className="p-8">Loading...</div>}>
			<SandboxContent />
		</Suspense>
	);
}
