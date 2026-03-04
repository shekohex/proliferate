interface SessionStatusMessageProps {
	message: string;
	variant?: "muted" | "destructive";
}

export function SessionStatusMessage({ message, variant = "muted" }: SessionStatusMessageProps) {
	const textClass = variant === "destructive" ? "text-destructive" : "text-muted-foreground";

	return (
		<div className="h-full flex items-center justify-center text-sm">
			<span className={textClass}>{message}</span>
		</div>
	);
}
