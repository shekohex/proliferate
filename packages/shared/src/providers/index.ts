/**
 * Sandbox Provider Factory
 */

import { env } from "@proliferate/environment/server";
import { CoderProvider } from "./coder";
import { E2BProvider } from "./e2b";
import type { SandboxProvider, SandboxProviderType } from "./types";

function isSandboxProviderType(value: string | undefined): value is SandboxProviderType {
	return value === "e2b" || value === "coder";
}

/**
 * Get a sandbox provider instance.
 */
export function getSandboxProvider(type?: SandboxProviderType): SandboxProvider {
	const providerType =
		type ??
		(isSandboxProviderType(env.DEFAULT_SANDBOX_PROVIDER)
			? env.DEFAULT_SANDBOX_PROVIDER
			: undefined);

	if (providerType === "coder") {
		return new CoderProvider();
	}

	return new E2BProvider();
}

export { CoderProvider } from "./coder";
export { getCoderProviderDefaults, getCoderTemplate, listCoderTemplates } from "./coder";
export { E2BProvider } from "./e2b";

export type { SandboxProvider, SandboxProviderType } from "./types";
