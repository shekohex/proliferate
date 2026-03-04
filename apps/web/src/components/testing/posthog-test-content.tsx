"use client";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export function PostHogTestContent() {
	const throwError = () => {
		throw new Error("PostHog Test: Intentional JavaScript error!");
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
			<Text variant="h3">PostHog Test Page</Text>
			<Text color="muted">Test dead clicks, rage clicks, and exception capture</Text>

			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<Text variant="small" className="font-medium">
						1. Dead Click Test
					</Text>
					<Button variant="default" disabled>
						Click me (I do nothing)
					</Button>
					<Text variant="small" color="muted">
						This button is disabled and has no click handler
					</Text>
				</div>

				<div className="flex flex-col gap-2">
					<Text variant="small" className="font-medium">
						2. Rage Click Test
					</Text>
					<Button
						variant="secondary"
						onClick={() => {
							// intentionally empty for rage click testing
						}}
					>
						Click me rapidly
					</Button>
					<Text variant="small" color="muted">
						Click this button many times quickly to trigger rage click detection
					</Text>
				</div>

				<div className="flex flex-col gap-2">
					<Text variant="small" className="font-medium">
						3. Exception Test
					</Text>
					<Button variant="destructive" onClick={throwError}>
						Throw Error
					</Button>
					<Text variant="small" color="muted">
						This will throw a JavaScript error to test exception capture
					</Text>
				</div>
			</div>
		</div>
	);
}
