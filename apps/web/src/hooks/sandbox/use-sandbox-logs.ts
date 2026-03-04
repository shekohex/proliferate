"use client";

import { useEffect, useRef, useState } from "react";

export function useSandboxLogs(previewUrl: string | null, selectedService: string | null) {
	const [logs, setLogs] = useState("");
	const eventSourceRef = useRef<EventSource | null>(null);

	useEffect(() => {
		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}

		if (!previewUrl || !selectedService) {
			setLogs("");
			return;
		}

		const logsUrl = new URL(
			`/api/logs/${encodeURIComponent(selectedService)}`,
			previewUrl,
		).toString();
		const es = new EventSource(logsUrl);
		eventSourceRef.current = es;

		es.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === "initial") {
					setLogs(data.content || "");
				} else if (data.type === "append") {
					setLogs((prev) => prev + (data.content || ""));
				}
			} catch {
				setLogs((prev) => prev + event.data);
			}
		};

		es.onerror = () => {
			es.close();
		};

		return () => es.close();
	}, [previewUrl, selectedService]);

	const clearLogs = () => setLogs("");

	return { logs, clearLogs };
}
