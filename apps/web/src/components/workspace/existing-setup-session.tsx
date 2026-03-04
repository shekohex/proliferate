import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ExistingSetupSessionProps {
	existingSessionId: string;
	repoId: string;
}

export function ExistingSetupSession({ existingSessionId, repoId }: ExistingSetupSessionProps) {
	return (
		<div className="flex h-full items-center justify-center">
			<div className="text-center space-y-4 max-w-md">
				<p className="text-sm text-foreground">
					A setup session is already running for this repository.
				</p>
				<p className="text-xs text-muted-foreground">
					Only one setup session can run at a time per repository.
				</p>
				<div className="flex items-center justify-center gap-3">
					<Button size="sm" asChild>
						<Link href={`/session/${existingSessionId}`}>Resume existing session</Link>
					</Button>
					<Button variant="outline" size="sm" asChild>
						<Link href={`/settings/repositories/${repoId}`}>Back to repository</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
