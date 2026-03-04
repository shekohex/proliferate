"use client";

import { useSession } from "@/lib/auth/client";
import { orpc } from "@/lib/orpc";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

function formatDeviceCode(value: string): string {
	const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
	if (cleaned.length > 8) return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
	if (cleaned.length > 4) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
	return cleaned;
}

export function useDeviceAuth() {
	const { data: session, isPending: sessionLoading } = useSession();
	const searchParams = useSearchParams();
	const [code, setCode] = useState("");
	const autoSubmittedRef = useRef(false);

	const authorizeDevice = useMutation(orpc.cli.auth.authorizeDevice.mutationOptions());

	const handleCodeChange = useCallback((value: string) => {
		const formatted = formatDeviceCode(value);
		if (formatted.replace("-", "").length <= 8) {
			setCode(formatted);
		}
	}, []);

	const submitCode = useCallback(
		(codeToSubmit: string) => {
			if (!codeToSubmit.trim() || codeToSubmit.length < 9) return;
			authorizeDevice.mutate({ userCode: codeToSubmit });
		},
		[authorizeDevice],
	);

	// Auto-populate code from URL
	useEffect(() => {
		const codeParam = searchParams.get("code");
		if (codeParam && !code) {
			handleCodeChange(codeParam);
		}
	}, [searchParams, code, handleCodeChange]);

	// Auto-submit when code is pre-filled and user is logged in
	useEffect(() => {
		const codeParam = searchParams.get("code");
		if (
			codeParam &&
			code.length === 9 &&
			session?.user &&
			authorizeDevice.isIdle &&
			!autoSubmittedRef.current
		) {
			autoSubmittedRef.current = true;
			const timer = setTimeout(() => {
				submitCode(code);
			}, 400);
			return () => clearTimeout(timer);
		}
	}, [code, session, authorizeDevice.isIdle, searchParams, submitCode]);

	// Try to close window after success
	useEffect(() => {
		if (authorizeDevice.isSuccess) {
			const timer = setTimeout(() => {
				window.close();
			}, 1500);
			return () => clearTimeout(timer);
		}
	}, [authorizeDevice.isSuccess]);

	// Redirect to sign-in if not authenticated
	useEffect(() => {
		if (sessionLoading || session?.user) return;
		const codeParam = searchParams.get("code");
		const deviceUrl = codeParam ? `/device?code=${codeParam}` : "/device";
		const returnUrl = encodeURIComponent(deviceUrl);
		window.location.href = `/sign-in?redirect=${returnUrl}`;
	}, [session, sessionLoading, searchParams]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		submitCode(code);
	};

	return {
		code,
		session,
		sessionLoading,
		authorizeDevice,
		handleCodeChange,
		handleSubmit,
	};
}
