"use client";

import { Button } from "@/components/ui/button";
import { X, Zap } from "lucide-react";

interface CoworkerBannerProps {
	onDismiss: () => void;
}

export function CoworkerBanner({ onDismiss }: CoworkerBannerProps) {
	return (
		<div className="flex items-center gap-2 px-4 py-2 bg-muted/60 border-b border-border text-sm text-muted-foreground shrink-0">
			<Zap className="h-3.5 w-3.5" />
			<span>Resumed from Coworker</span>
			<Button
				variant="ghost"
				size="icon"
				className="ml-auto h-6 w-6 text-muted-foreground/60 hover:text-foreground"
				onClick={onDismiss}
			>
				<X className="h-3.5 w-3.5" />
			</Button>
		</div>
	);
}
