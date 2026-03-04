"use client";

import { useCallback, useEffect, useState } from "react";

export interface ServiceInfo {
	name: string;
	command: string;
	pid: number;
	status: "running" | "stopped" | "error";
	startedAt: number;
	logFile: string;
}

export function useSandboxServices(previewUrl: string | null) {
	const [services, setServices] = useState<ServiceInfo[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const fetchServices = useCallback(async () => {
		if (!previewUrl) return;
		setLoading(true);
		try {
			const servicesUrl = new URL("/api/services", previewUrl).toString();
			const res = await fetch(servicesUrl);
			if (!res.ok) throw new Error(`Failed: ${res.status}`);
			const data = await res.json();
			setServices(data.services || []);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch services");
		} finally {
			setLoading(false);
		}
	}, [previewUrl]);

	useEffect(() => {
		fetchServices();
		const interval = setInterval(fetchServices, 5000);
		return () => clearInterval(interval);
	}, [fetchServices]);

	return { services, error, loading, fetchServices };
}
