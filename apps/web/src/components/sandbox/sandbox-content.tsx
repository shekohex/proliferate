"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusDot } from "@/components/ui/status-dot";
import { Text } from "@/components/ui/text";
import { useSandboxLogs } from "@/hooks/sandbox/use-sandbox-logs";
import { useSandboxServices } from "@/hooks/sandbox/use-sandbox-services";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SandboxContent() {
	const searchParams = useSearchParams();
	const previewUrl = searchParams.get("url");
	const [selectedService, setSelectedService] = useState<string | null>(null);
	const logsEndRef = useRef<HTMLDivElement>(null);

	const { services, error, loading, fetchServices } = useSandboxServices(previewUrl);
	const { logs, clearLogs } = useSandboxLogs(previewUrl, selectedService);

	// biome-ignore lint/correctness/useExhaustiveDependencies: we want to scroll when logs changes
	useEffect(() => {
		logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [logs]);

	if (!previewUrl) {
		return (
			<div className="mx-auto max-w-2xl p-8">
				<Text variant="h3" className="mb-4">
					Sandbox Services
				</Text>
				<Text color="muted" className="mb-4">
					Add <code className="rounded bg-muted px-1">?url=YOUR_PREVIEW_URL</code> to view services
				</Text>
				<Input
					type="text"
					placeholder="Paste preview URL..."
					className="font-mono"
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							const url = (e.target as HTMLInputElement).value;
							if (url) window.location.href = `/sandbox?url=${encodeURIComponent(url)}`;
						}
					}}
				/>
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col">
			<div className="flex items-center justify-between border-b bg-muted/30 p-3">
				<div className="flex items-center gap-3">
					<Text className="font-semibold">Services</Text>
					<code className="max-w-md truncate text-xs text-muted-foreground">{previewUrl}</code>
				</div>
				<Button variant="outline" size="sm" onClick={fetchServices} disabled={loading}>
					{loading ? "..." : "Refresh"}
				</Button>
			</div>

			{error && <div className="bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

			<div className="flex min-h-0 flex-1">
				<div className="w-64 overflow-auto border-r">
					{services.length === 0 ? (
						<div className="p-4 text-sm text-muted-foreground">No services running</div>
					) : (
						services.map((s) => (
							<div
								key={s.name}
								className={`cursor-pointer border-b p-3 hover:bg-muted/50 ${selectedService === s.name ? "bg-muted" : ""}`}
								onClick={() => setSelectedService(s.name)}
								onKeyDown={(e) => {
									if (e.key === "Enter") setSelectedService(s.name);
								}}
								role="button"
								tabIndex={0}
							>
								<div className="flex items-center gap-2">
									<StatusDot status={s.status} size="sm" />
									<span className="text-sm font-medium">{s.name}</span>
								</div>
								<div className="mt-1 truncate text-xs text-muted-foreground">{s.command}</div>
								<div className="text-xs text-muted-foreground">PID: {s.pid}</div>
							</div>
						))
					)}
				</div>

				<div className="flex min-w-0 flex-1 flex-col">
					{selectedService ? (
						<>
							<div className="flex items-center justify-between border-b bg-muted/20 p-2">
								<span className="text-sm font-medium">{selectedService} logs</span>
								<Button variant="ghost" size="sm" onClick={clearLogs}>
									Clear
								</Button>
							</div>
							<ScrollArea className="flex-1">
								<pre className="whitespace-pre-wrap p-3 font-mono text-xs">
									{logs || "No logs yet..."}
								</pre>
								<div ref={logsEndRef} />
							</ScrollArea>
						</>
					) : (
						<div className="flex flex-1 items-center justify-center text-muted-foreground">
							Select a service to view logs
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
