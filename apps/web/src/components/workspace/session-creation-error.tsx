import { Button } from "@/components/ui/button";

interface SessionCreationErrorProps {
	message: string;
	onRetry: () => void;
}

export function SessionCreationError({ message, onRetry }: SessionCreationErrorProps) {
	return (
		<div className="flex h-full items-center justify-center">
			<div className="text-center space-y-4">
				<p className="text-destructive">{message}</p>
				<Button variant="link" className="h-auto p-0 text-sm" onClick={onRetry}>
					Try again
				</Button>
			</div>
		</div>
	);
}
