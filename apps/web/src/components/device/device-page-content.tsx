"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useDeviceAuth } from "@/hooks/device/use-device-auth";
import { Loader2 } from "lucide-react";

export function DevicePageContent() {
	const { code, session, sessionLoading, authorizeDevice, handleCodeChange, handleSubmit } =
		useDeviceAuth();

	if (sessionLoading || !session?.user) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
			</div>
		);
	}

	if (authorizeDevice.isSuccess) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-6">
				<div className="w-full max-w-[360px] text-center">
					<Text variant="h3" className="mb-2">
						Device Authorized
					</Text>
					<Text color="muted" className="mb-1">
						Closing this window...
					</Text>
					<Text variant="small" color="muted">
						If it doesn't close, you can close it manually.
					</Text>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-6">
			<div className="w-full max-w-[360px]">
				<div className="mb-7 text-center">
					<Text variant="h3">Authorize CLI</Text>
					<Text color="muted" className="mt-2">
						Enter the code shown in your terminal
					</Text>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="code" className="text-sm font-medium">
							Authorization code
						</Label>
						<Input
							id="code"
							type="text"
							placeholder="ABCD-1234"
							value={code}
							onChange={(e) => handleCodeChange(e.target.value)}
							className="h-12 rounded-lg text-center font-mono text-xl tracking-widest"
							maxLength={9}
							autoFocus
							autoComplete="off"
							spellCheck={false}
						/>
						{authorizeDevice.isError && (
							<Text variant="small" className="text-destructive">
								{authorizeDevice.error.message || "Something went wrong. Please try again."}
							</Text>
						)}
					</div>

					<Button
						type="submit"
						className="h-11 w-full rounded-lg"
						disabled={code.length < 9 || authorizeDevice.isPending}
					>
						{authorizeDevice.isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Authorizing...
							</>
						) : (
							"Authorize"
						)}
					</Button>

					<Text variant="small" color="muted" className="text-center">
						Signed in as {session.user.email}
					</Text>
				</form>
			</div>
		</div>
	);
}
