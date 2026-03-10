"use client";

import { CREATION_MESSAGES, RESUME_MESSAGES } from "@/config/session-loading";
import { cn } from "@/lib/display/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

/** Resume: a monitor with a play symbol — session waking up */
function ResumeIllustration() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="66" height="66" viewBox="0 0 66 66" fill="none">
			{/* Monitor body */}
			<rect
				x="10"
				y="10"
				width="46"
				height="34"
				rx="5"
				className="fill-muted/40 dark:fill-muted/50 stroke-muted-foreground/35 dark:stroke-muted-foreground/45"
				strokeWidth="1.5"
			/>
			{/* Screen */}
			<rect
				x="14"
				y="14"
				width="38"
				height="26"
				rx="2.5"
				className="fill-background/70 dark:fill-background/55 stroke-muted-foreground/25 dark:stroke-muted-foreground/35"
				strokeWidth="1.2"
			/>
			{/* Play triangle centered on screen */}
			<path
				d="M29 22L29 32L38 27Z"
				className="fill-muted-foreground/55 dark:fill-muted-foreground/65 animate-pulse"
				strokeLinejoin="round"
			/>
			{/* Stand */}
			<path
				d="M33 44V50"
				className="stroke-muted-foreground/40 dark:stroke-muted-foreground/50"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
			<path
				d="M27 50H39"
				className="stroke-muted-foreground/40 dark:stroke-muted-foreground/50"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
		</svg>
	);
}

/** Creating: a terminal window with a blinking cursor */
function CreatingIllustration() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="66" height="66" viewBox="0 0 66 66" fill="none">
			<rect
				x="8"
				y="12"
				width="50"
				height="38"
				rx="5"
				className="fill-muted/40 dark:fill-muted/50 stroke-muted-foreground/35 dark:stroke-muted-foreground/45"
				strokeWidth="1.5"
			/>
			<line
				x1="8"
				y1="22"
				x2="58"
				y2="22"
				className="stroke-muted-foreground/20 dark:stroke-muted-foreground/30"
				strokeWidth="1"
			/>
			<circle
				cx="15"
				cy="17"
				r="1.5"
				className="fill-muted-foreground/30 dark:fill-muted-foreground/40"
			/>
			<circle
				cx="21"
				cy="17"
				r="1.5"
				className="fill-muted-foreground/25 dark:fill-muted-foreground/35"
			/>
			<circle
				cx="27"
				cy="17"
				r="1.5"
				className="fill-muted-foreground/20 dark:fill-muted-foreground/30"
			/>
			<path
				d="M15 30L19 33L15 36"
				className="stroke-muted-foreground/45 dark:stroke-muted-foreground/55"
				strokeWidth="1.4"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<line
				x1="23"
				y1="33"
				x2="38"
				y2="33"
				className="stroke-muted-foreground/30 dark:stroke-muted-foreground/40"
				strokeWidth="1.3"
				strokeLinecap="round"
			/>
			<line
				x1="41"
				y1="31"
				x2="41"
				y2="35"
				className="stroke-muted-foreground/50 dark:stroke-muted-foreground/60 animate-pulse"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
			<line
				x1="15"
				y1="40"
				x2="32"
				y2="40"
				className="stroke-muted-foreground/20 dark:stroke-muted-foreground/30"
				strokeWidth="1.2"
				strokeLinecap="round"
			/>
			<line
				x1="15"
				y1="44"
				x2="26"
				y2="44"
				className="stroke-muted-foreground/15 dark:stroke-muted-foreground/25"
				strokeWidth="1.2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

interface SessionLoadingShellProps {
	mode: "creating" | "resuming";
	repoName?: string;
	existingMessages?: Array<{
		id: string;
		role: "user" | "assistant";
		content: string;
	}>;
	initialPrompt?: string;
	showHeader?: boolean;
}

export function SessionLoadingShell({
	mode,
	repoName,
	existingMessages,
	initialPrompt,
	showHeader = true,
}: SessionLoadingShellProps) {
	const messages = mode === "creating" ? CREATION_MESSAGES : RESUME_MESSAGES;
	const [messageIndex, setMessageIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setMessageIndex((prev) => (prev + 1) % messages.length);
		}, 2500);
		return () => clearInterval(interval);
	}, [messages.length]);

	const hasExistingMessages = existingMessages && existingMessages.length > 0;
	const showEagerPrompt = mode === "creating" && initialPrompt && !hasExistingMessages;

	const Illustration = mode === "creating" ? CreatingIllustration : ResumeIllustration;

	return (
		<div className="flex h-full flex-col">
			{showHeader && (
				<div className="shrink-0 border-b bg-background px-4 py-3">
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
							<span className="text-sm text-muted-foreground">
								{mode === "creating" ? "Starting session" : "Resuming"}
							</span>
						</div>
						{repoName && (
							<>
								<span className="text-muted-foreground">·</span>
								<span className="text-sm text-muted-foreground">{repoName}</span>
							</>
						)}
					</div>
				</div>
			)}

			<div className="flex-1 min-h-0 flex flex-col">
				<div className="flex-1 overflow-y-auto">
					{hasExistingMessages ? (
						<div className="py-4">
							{existingMessages.map((msg) => (
								<div key={msg.id} className="py-3 px-4">
									<div
										className={cn(
											"max-w-3xl mx-auto",
											msg.role === "user" && "flex flex-col items-end",
										)}
									>
										{msg.role === "user" ? (
											<div className="bg-muted rounded-2xl px-4 py-2 text-sm max-w-[80%]">
												<p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
											</div>
										) : (
											<div className="text-sm">
												<p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
											</div>
										)}
									</div>
								</div>
							))}
							<div className="py-4 px-4">
								<div className="max-w-3xl mx-auto">
									<BlinkingCursor />
								</div>
							</div>
						</div>
					) : showEagerPrompt ? (
						<div className="py-4">
							<div className="py-3 px-4">
								<div className="max-w-3xl mx-auto flex flex-col items-end">
									<div className="bg-muted rounded-2xl px-4 py-2 text-sm max-w-[80%]">
										<p className="leading-relaxed whitespace-pre-wrap">{initialPrompt}</p>
									</div>
								</div>
							</div>
							<div className="py-4 px-4">
								<div className="max-w-3xl mx-auto">
									<BlinkingCursor />
								</div>
							</div>
						</div>
					) : (
						<div className="flex h-full flex-col items-center justify-center p-8 text-center">
							<Illustration />
							<p
								key={messageIndex}
								className="mt-5 text-sm text-muted-foreground animate-in fade-in duration-500"
							>
								{messages[messageIndex]}
							</p>
						</div>
					)}
				</div>

				<div className="shrink-0 p-4">
					<div className="max-w-3xl mx-auto w-full">
						<div className="flex flex-col rounded-2xl border bg-muted/40 dark:bg-chat-input opacity-50">
							<div className="px-4 py-3 text-sm text-muted-foreground">Message...</div>
							<div className="flex items-center justify-between px-2 py-1.5">
								<div className="flex items-center gap-1">
									<div className="h-8 w-8" />
								</div>
								<div className="flex items-center gap-1">
									<div className="h-7 w-7 rounded-lg bg-primary/50" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

const BlinkingCursor = () => <span className="inline-block w-2 h-4 bg-foreground animate-pulse" />;
