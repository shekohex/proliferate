"use client";

import { AuthLayout } from "@/components/auth/auth-layout";
import { CheckBadge, MailIllustration } from "@/components/auth/mail-illustration";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useVerifyEmail } from "@/hooks/auth/use-verify-email";
import { signOut } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

export function VerifyEmailContent() {
	const router = useRouter();
	const { session, isPending, email, isResending, resent, error, handleResend } = useVerifyEmail();

	if (isPending) {
		return (
			<AuthLayout>
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
			</AuthLayout>
		);
	}

	if (session?.user?.emailVerified) {
		return null;
	}

	return (
		<AuthLayout>
			<div className="w-full max-w-[380px]">
				{/* Illustration + badge */}
				<div className="mb-6 flex justify-center">
					<div className="relative flex flex-col items-center">
						<MailIllustration />
						{/* Shadow */}
						<div className="mt-1 h-1.5 w-6 scale-x-[2] rounded-full bg-muted" />
						{/* Badge */}
						<div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background text-muted-foreground">
							<CheckBadge />
						</div>
					</div>
				</div>

				{/* Header */}
				<div className="mb-6 text-center">
					<h1 className="text-xl font-semibold tracking-tight text-foreground">Check your email</h1>
					<p className="mt-1.5 text-sm text-muted-foreground">
						{email ? (
							<>
								We sent a verification link to <span className="text-foreground">{email}</span>
							</>
						) : (
							"We sent a verification link to your email"
						)}
					</p>
				</div>

				{/* Card */}
				<div className="rounded-lg border border-border bg-card/50 p-5">
					<p className="mb-4 text-center text-xs text-muted-foreground">
						Click the link in the email to verify your account. Check spam if you don&apos;t see it.
					</p>

					{resent && (
						<Text color="success" className="mb-3 text-center text-xs">
							Verification email sent!
						</Text>
					)}
					{error && <p className="mb-3 text-center text-xs text-destructive">{error}</p>}

					<div className="space-y-2">
						{email && (
							<Button
								variant="light"
								size="lg"
								className="w-full"
								onClick={handleResend}
								disabled={isResending || resent}
								type="button"
							>
								{isResending ? "Sending..." : resent ? "Email sent" : "Resend verification email"}
							</Button>
						)}
						<Button
							type="button"
							variant="ghost"
							className="h-10 w-full text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
							onClick={async () => {
								await signOut();
								router.push("/sign-in");
							}}
						>
							Back to sign in
						</Button>
					</div>
				</div>
			</div>
		</AuthLayout>
	);
}
