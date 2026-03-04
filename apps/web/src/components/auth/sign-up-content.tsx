"use client";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, GoogleIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignUp } from "@/hooks/auth/use-sign-up";
import { buildAuthLink } from "@/lib/auth/utils";
import Link from "next/link";

export function SignUpContent() {
	const {
		session,
		isPending,
		name,
		setName,
		email,
		setEmail,
		password,
		setPassword,
		showPassword,
		setShowPassword,
		googleLoading,
		formLoading,
		hasGoogleOAuth,
		redirectUrl,
		handleGoogleSignIn,
		handleEmailSignUp,
	} = useSignUp();

	if (isPending) {
		return (
			<AuthLayout>
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-muted-foreground" />
			</AuthLayout>
		);
	}

	if (session) {
		return null;
	}

	const signInHref = buildAuthLink("/sign-in", redirectUrl, email);

	return (
		<AuthLayout>
			<div className="w-full max-w-[380px]">
				<div className="mb-8 text-center">
					<h1 className="text-xl font-semibold tracking-tight text-foreground">
						Create Your Proliferate Account
					</h1>
					<p className="mt-1.5 text-sm text-muted-foreground">
						Get started with Proliferate for free
					</p>
				</div>

				{hasGoogleOAuth && (
					<>
						<Button
							variant="outline"
							className="h-10 w-full gap-2.5 rounded-lg text-sm font-medium"
							onClick={handleGoogleSignIn}
							disabled={googleLoading || formLoading}
							type="button"
						>
							<GoogleIcon className="h-4 w-4" />
							{googleLoading ? "..." : "Google"}
						</Button>

						<div className="my-6 flex items-center gap-3">
							<div className="h-px flex-1 bg-border" />
							<span className="text-xs text-muted-foreground">or</span>
							<div className="h-px flex-1 bg-border" />
						</div>
					</>
				)}

				<form onSubmit={handleEmailSignUp} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="name" className="text-sm font-medium text-muted-foreground">
							Name
						</Label>
						<Input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Your name"
							required
							disabled={formLoading || googleLoading}
							className="h-10 rounded-lg"
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
							Email
						</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@company.com"
							required
							disabled={formLoading || googleLoading}
							className="h-10 rounded-lg"
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
							Password
						</Label>
						<div className="relative">
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="At least 8 characters"
								required
								disabled={formLoading || googleLoading}
								className="h-10 rounded-lg pr-10"
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:bg-transparent hover:text-foreground"
							>
								{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</Button>
						</div>
					</div>

					<Button
						type="submit"
						className="h-10 w-full rounded-lg"
						disabled={formLoading || googleLoading}
					>
						{formLoading ? "Creating account..." : "Create account"}
					</Button>
				</form>

				<p className="mt-6 text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link
						href={signInHref}
						className="text-foreground transition-colors hover:text-foreground"
					>
						Sign in
					</Link>
				</p>
			</div>
		</AuthLayout>
	);
}
