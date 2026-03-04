"use client";

import { Text } from "@/components/ui/text";

export function InvitationLoading({ message }: { message: string }) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="text-center">
				<div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
				<Text variant="body" color="muted" className="mt-4">
					{message}
				</Text>
			</div>
		</div>
	);
}
