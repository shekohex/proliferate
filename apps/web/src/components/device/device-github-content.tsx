"use client";

import { ConnectionSelector } from "@/components/integrations/connection-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GithubIcon } from "@/components/ui/icons";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useDeviceGitHub } from "@/hooks/device/use-device-github";
import { CheckCircle2, Laptop, Loader2 } from "lucide-react";

export function DeviceGitHubContent() {
	const {
		session,
		sessionLoading,
		selectionState,
		cliOrgId,
		isConfirming,
		pendingId,
		handleConfirm,
		setPendingSelection,
	} = useDeviceGitHub();

	if (sessionLoading || !session?.user) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (selectionState.type === "connected") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardContent className="pt-8">
						<div className="space-y-4 py-4 text-center">
							<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
								<CheckCircle2 className="h-8 w-8 text-success" />
							</div>
							<div>
								<Text variant="h4">GitHub Connected!</Text>
								<Text variant="small" color="muted" className="mt-1">
									You can close this window and return to your terminal.
								</Text>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (selectionState.type === "local-git") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardContent className="pt-8">
						<div className="space-y-4 py-4 text-center">
							<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-info/10">
								<Laptop className="h-8 w-8 text-info" />
							</div>
							<div>
								<Text variant="h4">Using Local Git Credentials</Text>
								<Text variant="small" color="muted" className="mt-1">
									Your local git credentials will be used for authentication. You can close this
									window and return to your terminal.
								</Text>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardContent className="pt-8">
					<div className="space-y-6">
						<div className="space-y-2 text-center">
							<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
								<GithubIcon className="h-8 w-8 text-foreground" />
							</div>
							<div>
								<Text variant="h4">Connect GitHub</Text>
								<Text variant="small" color="muted" className="mt-1">
									Choose a GitHub connection for this directory.
								</Text>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="text-xs text-muted-foreground">GitHub Connection</Label>
							<ConnectionSelector
								provider="github"
								selectedId={pendingId}
								onSelect={(connectionId) => setPendingSelection(connectionId)}
								showLocalGitOption={true}
								onSelectLocalGit={() => setPendingSelection("local-git")}
								returnUrl={cliOrgId ? `/device-github?orgId=${cliOrgId}` : "/device-github"}
								autoSelectSingle={false}
							/>
						</div>

						<Button
							onClick={handleConfirm}
							disabled={!pendingId || isConfirming}
							className="w-full"
						>
							{isConfirming ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
									Confirming...
								</>
							) : (
								"Confirm Selection"
							)}
						</Button>

						<Text variant="small" color="muted" className="text-center">
							Signed in as {session.user.email}
						</Text>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
