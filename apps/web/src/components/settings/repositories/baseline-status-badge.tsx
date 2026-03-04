import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
	ready: "text-foreground",
	validating: "text-muted-foreground",
	stale: "text-muted-foreground",
	failed: "text-destructive",
};

const labels: Record<string, string> = {
	ready: "Ready",
	validating: "Validating",
	stale: "Stale",
	failed: "Failed",
};

export function BaselineStatusBadge({ status }: { status: string }) {
	return (
		<span className={cn("text-xs font-medium", styles[status] ?? "text-muted-foreground")}>
			{labels[status] ?? status}
		</span>
	);
}
