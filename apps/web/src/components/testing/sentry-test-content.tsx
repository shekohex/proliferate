"use client";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { orpc } from "@/lib/orpc";
import * as Sentry from "@sentry/nextjs";
import { toast } from "sonner";

export function SentryTestContent() {
	const throwClientError = () => {
		throw new Error("Sentry Test: Client-side error thrown intentionally!");
	};

	const captureManualError = () => {
		Sentry.captureException(new Error("Sentry Test: Manually captured exception!"));
		toast.success("Error captured and sent to Sentry!");
	};

	const triggerServerError = async () => {
		try {
			await orpc.admin.sentryTestError.call({});
		} catch {
			toast.info("Server error triggered - check Sentry!");
		}
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
			<Text variant="h3">Sentry Integration Test</Text>
			<Text color="muted">Click buttons below to test different error scenarios</Text>

			<div className="flex flex-col gap-4">
				<Button variant="destructive" onClick={throwClientError}>
					Throw Client Error (crashes page)
				</Button>

				<Button variant="outline" onClick={captureManualError}>
					Capture Manual Exception (no crash)
				</Button>

				<Button variant="outline" onClick={triggerServerError}>
					Trigger Server-Side Error
				</Button>
			</div>

			<Text variant="small" color="muted" className="mt-8">
				Check your Sentry dashboard to see if errors are being captured.
			</Text>
		</div>
	);
}
