import { Api } from "@coder/sdk";
import { env } from "@proliferate/environment/server";
import type {
	CoderProviderSettings,
	CoderTemplateDetail,
	CoderTemplateParameterValue,
	CoderTemplateSummary,
	CoderTemplateVariable,
} from "../contracts/coder-provider";
import { getSharedLogger } from "../logger";
import { SandboxProviderError } from "../sandbox";
import type {
	AutoStartOutputEntry,
	ConfigurationServiceCommand,
	CreateSandboxOpts,
	CreateSandboxResult,
	EnsureSandboxResult,
	FileContent,
	PauseResult,
	SandboxProvider,
	SnapshotResult,
} from "./types";

const log = getSharedLogger().child({ module: "coder" });

const MAX_WORKSPACE_NAME_LENGTH = 32;
const WORKSPACE_NAME_PREFIX = "prol";
const LIVE_WORKSPACE_STATUSES = new Set(["running", "starting", "pending"]);

type MinimalCoderUser = {
	id: string;
	username: string;
};

type MinimalCoderBuild = {
	template_version_id: string;
	status: string;
};

type WorkspaceBuildParameter = {
	name: string;
	value: string;
};

type MinimalCoderWorkspace = {
	id: string;
	owner_name: string;
	name: string;
	template_id: string;
	latest_build: MinimalCoderBuild & {
		resources?: Array<{
			name: string;
			agents?: Array<{
				id: string;
				name: string;
				apps?: Array<{
					slug: string;
					display_name?: string;
					url?: string;
					external: boolean;
					subdomain: boolean;
					subdomain_name?: string;
					health: string;
					hidden: boolean;
				}>;
			}>;
		}>;
	};
	health: {
		healthy: boolean;
	};
};

type MinimalCoderClient = {
	setHost(host: string | undefined): void;
	setSessionToken(token: string): void;
	getAuthenticatedUser(): Promise<MinimalCoderUser>;
	getWorkspace(workspaceId: string): Promise<MinimalCoderWorkspace>;
	getOrganizationWorkspaceByOwnerAndName(
		ownerName: string,
		workspaceName: string,
	): Promise<MinimalCoderWorkspace>;
	createWorkspace(
		userId: string,
		workspace: {
			name: string;
			template_id: string;
			rich_parameter_values?: readonly WorkspaceBuildParameter[];
			template_version_preset_id?: string;
		},
	): Promise<MinimalCoderWorkspace>;
	startWorkspace(
		workspaceId: string,
		templateVersionId: string,
		logLevel: undefined,
		buildParameters?: readonly WorkspaceBuildParameter[],
	): Promise<MinimalCoderBuild>;
	waitForBuild(build: MinimalCoderBuild): Promise<unknown>;
	getTemplate(templateId: string): Promise<{
		id: string;
		name: string;
		display_name: string;
		description: string;
		active_version_id: string;
		deprecated: boolean;
	}>;
	getTemplates(): Promise<
		Array<{
			id: string;
			name: string;
			display_name: string;
			description: string;
			active_version_id: string;
			deprecated: boolean;
		}>
	>;
	getTemplateVersionRichParameters(versionId: string): Promise<
		Array<{
			display_name?: string;
			name: string;
			description: string;
			type: string;
			default_value: string;
			form_type: string;
			mutable: boolean;
			icon: string;
			options: Array<{
				name: string;
				description: string;
				value: string;
				icon: string;
			}>;
			validation_error?: string;
			validation_regex?: string;
			validation_min?: number;
			validation_max?: number;
			validation_monotonic?: string;
			required: boolean;
			sensitive?: boolean;
			ephemeral: boolean;
		}>
	>;
	getTemplateVersionPresets(versionId: string): Promise<Array<{
		ID: string;
		Name: string;
		Description: string;
		Icon: string;
		Default: boolean;
		Parameters: Array<{
			Name: string;
			Value: string;
		}>;
	}> | null>;
};

function buildWorkspaceName(sessionId: string): string {
	const normalized = sessionId
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/^-+|-+$/g, "");
	const maxSuffixLength = MAX_WORKSPACE_NAME_LENGTH - WORKSPACE_NAME_PREFIX.length - 1;
	const suffix = normalized.slice(0, maxSuffixLength).replace(/-+$/g, "") || "session";
	return `${WORKSPACE_NAME_PREFIX}-${suffix}`;
}

function isNotFoundError(error: unknown): boolean {
	return typeof error === "object" && error !== null && "status" in error && error.status === 404;
}

function createUnsupportedError(
	operation: keyof Pick<
		SandboxProvider,
		| "snapshot"
		| "pause"
		| "terminate"
		| "writeEnvFile"
		| "resolveTunnels"
		| "readFiles"
		| "testServiceCommands"
		| "execCommand"
	>,
): SandboxProviderError {
	return new SandboxProviderError({
		provider: "coder",
		operation,
		message: `Coder provider ${operation} is not implemented yet`,
		isRetryable: false,
	});
}

function createCoderClient(
	operation: "createSandbox" | "ensureSandbox" | "health" | "listTemplates" | "getTemplate",
): MinimalCoderClient {
	if (!env.CODER_URL || !env.CODER_SESSION_TOKEN) {
		throw new SandboxProviderError({
			provider: "coder",
			operation,
			message: "CODER_URL and CODER_SESSION_TOKEN are required",
			isRetryable: false,
		});
	}

	const client = new Api() as unknown as MinimalCoderClient;
	client.setHost(env.CODER_URL);
	client.setSessionToken(env.CODER_SESSION_TOKEN);
	return client;
}

function getTemplateParameters(
	_operation: "createSandbox" | "ensureSandbox",
	parameters: CoderTemplateParameterValue[] | undefined,
): readonly WorkspaceBuildParameter[] | undefined {
	return parameters && parameters.length > 0 ? parameters : undefined;
}

function mapTemplateSummary(template: {
	id: string;
	name: string;
	display_name: string;
	description: string;
	active_version_id: string;
	deprecated: boolean;
}): CoderTemplateSummary {
	return {
		id: template.id,
		name: template.name,
		displayName: template.display_name,
		description: template.description,
		activeVersionId: template.active_version_id,
		deprecated: template.deprecated,
	};
}

function mapTemplateVariable(variable: {
	name: string;
	display_name?: string;
	description: string;
	type: string;
	default_value: string;
	form_type: string;
	required: boolean;
	sensitive?: boolean;
	mutable: boolean;
	ephemeral: boolean;
	icon: string;
	options: Array<{
		name: string;
		description: string;
		value: string;
		icon: string;
	}>;
	validation_error?: string;
	validation_regex?: string;
	validation_min?: number;
	validation_max?: number;
	validation_monotonic?: string;
}): CoderTemplateVariable {
	return {
		name: variable.name,
		displayName: variable.display_name ?? null,
		description: variable.description,
		type: variable.type,
		defaultValue: variable.default_value,
		formType: variable.form_type,
		required: variable.required,
		sensitive: variable.sensitive ?? false,
		mutable: variable.mutable,
		ephemeral: variable.ephemeral,
		icon: variable.icon || null,
		options: variable.options.map((option) => ({
			name: option.name,
			description: option.description,
			value: option.value,
			icon: option.icon || null,
		})),
		validationRegex: variable.validation_regex ?? null,
		validationMin: variable.validation_min ?? null,
		validationMax: variable.validation_max ?? null,
		validationMonotonic: variable.validation_monotonic ?? null,
		validationError: variable.validation_error ?? null,
	};
}

export function getCoderProviderDefaults(): Pick<
	CoderProviderSettings,
	| "enabled"
	| "configured"
	| "host"
	| "defaultTemplateId"
	| "defaultTemplateVersionPresetId"
	| "defaultParameters"
	| "error"
> {
	const enabled = env.DEFAULT_SANDBOX_PROVIDER === "coder";
	const configured = Boolean(env.CODER_URL && env.CODER_SESSION_TOKEN);

	return {
		enabled,
		configured,
		host: env.CODER_URL ?? null,
		defaultTemplateId: null,
		defaultTemplateVersionPresetId: null,
		defaultParameters: [],
		error: enabled && !configured ? "CODER_URL and CODER_SESSION_TOKEN must be configured." : null,
	};
}

export async function listCoderTemplates(): Promise<CoderTemplateSummary[]> {
	const client = createCoderClient("listTemplates");
	try {
		const templates = await client.getTemplates();
		return templates.map(mapTemplateSummary);
	} catch (error) {
		throw SandboxProviderError.fromError(error, "coder", "listTemplates");
	}
}

export async function getCoderTemplate(templateId: string): Promise<CoderTemplateDetail> {
	const client = createCoderClient("getTemplate");
	try {
		const template = await client.getTemplate(templateId);
		const [variables, presets] = await Promise.all([
			client.getTemplateVersionRichParameters(template.active_version_id),
			client.getTemplateVersionPresets(template.active_version_id),
		]);
		return {
			...mapTemplateSummary(template),
			variables: variables.map(mapTemplateVariable),
			presets: (presets ?? []).map((preset) => ({
				id: preset.ID,
				name: preset.Name,
				description: preset.Description,
				icon: preset.Icon || null,
				isDefault: preset.Default,
				parameters: preset.Parameters.map((parameter) => ({
					name: parameter.Name,
					value: parameter.Value,
				})),
			})),
		};
	} catch (error) {
		throw SandboxProviderError.fromError(error, "coder", "getTemplate");
	}
}

async function waitForWorkspaceReady(
	client: MinimalCoderClient,
	workspace: MinimalCoderWorkspace,
	buildParameters: readonly WorkspaceBuildParameter[] | undefined,
): Promise<MinimalCoderWorkspace> {
	const status = workspace.latest_build.status;

	if (status === "running") {
		return workspace;
	}

	if (status === "starting" || status === "pending") {
		await client.waitForBuild(workspace.latest_build);
		return client.getWorkspace(workspace.id);
	}

	if (status === "stopped") {
		const build = await client.startWorkspace(
			workspace.id,
			workspace.latest_build.template_version_id,
			undefined,
			buildParameters,
		);
		await client.waitForBuild(build);
		return client.getWorkspace(workspace.id);
	}

	throw new SandboxProviderError({
		provider: "coder",
		operation: "ensureSandbox",
		message: `Workspace ${workspace.id} is in unsupported state '${status}'`,
		isRetryable: status === "canceling" || status === "stopping",
	});
}

function toSandboxResult(workspace: MinimalCoderWorkspace): CreateSandboxResult {
	const openCodeUrl = resolveWorkspaceAppUrl(workspace, ["opencode"], 4096);
	const previewUrl = resolveWorkspaceAppUrl(workspace, ["preview"], 3000);
	return {
		sandboxId: workspace.id,
		tunnelUrl: openCodeUrl,
		previewUrl,
	};
}

function buildCoderPathAppUrl(
	workspace: MinimalCoderWorkspace,
	agentName: string,
	appSlug: string,
): string {
	if (!env.CODER_URL) {
		return "";
	}

	const url = new URL(env.CODER_URL);
	const basePath = url.pathname.replace(/\/$/, "");
	url.pathname = `${basePath}/@${encodeURIComponent(workspace.owner_name)}/${encodeURIComponent(workspace.name)}.${encodeURIComponent(agentName)}/apps/${encodeURIComponent(appSlug)}/`;
	url.search = "";
	url.hash = "";
	return url.toString().replace(/\/$/, "");
}

function resolveWorkspaceAppUrl(
	workspace: MinimalCoderWorkspace,
	preferredSlugs: string[],
	fallbackPort: number,
): string {
	const agents =
		workspace.latest_build.resources
			?.flatMap((resource) => resource.agents ?? [])
			.filter(Boolean) ?? [];

	for (const agent of agents) {
		const apps = agent.apps ?? [];
		const app =
			apps.find((candidate) => preferredSlugs.includes(candidate.slug) && !candidate.external) ??
			apps.find((candidate) => candidate.url?.startsWith(`http://localhost:${fallbackPort}`));
		if (app) {
			return buildCoderPathAppUrl(workspace, agent.name, app.slug);
		}
	}

	return "";
}

async function getExistingWorkspace(
	client: MinimalCoderClient,
	user: MinimalCoderUser,
	currentWorkspaceId: string | undefined,
	workspaceName: string,
): Promise<MinimalCoderWorkspace | null> {
	if (currentWorkspaceId) {
		try {
			return await client.getWorkspace(currentWorkspaceId);
		} catch (error) {
			if (!isNotFoundError(error)) {
				throw error;
			}
		}
	}

	try {
		return await client.getOrganizationWorkspaceByOwnerAndName(user.username, workspaceName);
	} catch (error) {
		if (isNotFoundError(error)) {
			return null;
		}
		throw error;
	}
}

export class CoderProvider implements SandboxProvider {
	readonly type = "coder" as const;
	readonly supportsPause = false;
	readonly supportsAutoPause = false;

	async ensureSandbox(opts: CreateSandboxOpts): Promise<EnsureSandboxResult> {
		try {
			const client = createCoderClient("ensureSandbox");
			const buildParameters = getTemplateParameters("ensureSandbox", opts.coderTemplateParameters);
			const user = await client.getAuthenticatedUser();
			const workspaceName = buildWorkspaceName(opts.sessionId);
			const existingWorkspace = await getExistingWorkspace(
				client,
				user,
				opts.currentSandboxId,
				workspaceName,
			);

			if (existingWorkspace) {
				const workspace = await waitForWorkspaceReady(client, existingWorkspace, buildParameters);
				log.info(
					{ sessionId: opts.sessionId, workspaceId: workspace.id },
					"Coder workspace reused",
				);
				return {
					...toSandboxResult(workspace),
					recovered: true,
				};
			}

			const result = await this.createSandbox(opts);
			return { ...result, recovered: false };
		} catch (error) {
			throw SandboxProviderError.fromError(error, "coder", "ensureSandbox");
		}
	}

	async createSandbox(opts: CreateSandboxOpts): Promise<CreateSandboxResult> {
		try {
			const templateId = opts.coderTemplateId;
			if (!templateId) {
				throw new SandboxProviderError({
					provider: "coder",
					operation: "createSandbox",
					message: "Coder template selection is required",
					isRetryable: false,
				});
			}

			const client = createCoderClient("createSandbox");
			const buildParameters = getTemplateParameters("createSandbox", opts.coderTemplateParameters);
			const user = await client.getAuthenticatedUser();
			await client.getTemplate(templateId);
			const workspaceName = buildWorkspaceName(opts.sessionId);
			const existingWorkspace = await getExistingWorkspace(client, user, undefined, workspaceName);

			if (existingWorkspace) {
				throw new SandboxProviderError({
					provider: "coder",
					operation: "createSandbox",
					message: `Workspace '${workspaceName}' already exists; use ensureSandbox() to reuse it`,
					isRetryable: false,
				});
			}

			const createdWorkspace = await client.createWorkspace(user.id, {
				name: workspaceName,
				template_id: templateId,
				rich_parameter_values: buildParameters,
				template_version_preset_id: opts.coderTemplateVersionPresetId ?? undefined,
			});
			const workspace = await waitForWorkspaceReady(client, createdWorkspace, buildParameters);
			log.info({ sessionId: opts.sessionId, workspaceId: workspace.id }, "Coder workspace created");
			return toSandboxResult(workspace);
		} catch (error) {
			throw SandboxProviderError.fromError(error, "coder", "createSandbox");
		}
	}

	async snapshot(_sessionId: string, _sandboxId: string): Promise<SnapshotResult> {
		throw createUnsupportedError("snapshot");
	}

	async pause(_sessionId: string, _sandboxId: string): Promise<PauseResult> {
		throw createUnsupportedError("pause");
	}

	async terminate(_sessionId: string, _sandboxId?: string): Promise<void> {
		throw createUnsupportedError("terminate");
	}

	async writeEnvFile(_sandboxId: string, _envVars: Record<string, string>): Promise<void> {
		throw createUnsupportedError("writeEnvFile");
	}

	async health(): Promise<boolean> {
		if (!env.CODER_URL || !env.CODER_SESSION_TOKEN) {
			return false;
		}

		try {
			const client = createCoderClient("health");
			await client.getAuthenticatedUser();
			return true;
		} catch (error) {
			log.warn({ err: error }, "Coder health check failed");
			return false;
		}
	}

	async checkSandboxes(sandboxIds: string[]): Promise<string[]> {
		if (sandboxIds.length === 0) {
			return [];
		}

		try {
			const client = createCoderClient("health");
			const workspaces = await Promise.all(
				sandboxIds.map(async (sandboxId) => {
					try {
						return await client.getWorkspace(sandboxId);
					} catch (error) {
						if (isNotFoundError(error)) {
							return null;
						}
						throw error;
					}
				}),
			);

			return workspaces
				.filter((workspace): workspace is MinimalCoderWorkspace => workspace !== null)
				.filter((workspace) => LIVE_WORKSPACE_STATUSES.has(workspace.latest_build.status))
				.map((workspace) => workspace.id);
		} catch (error) {
			throw SandboxProviderError.fromError(error, "coder", "checkSandboxes");
		}
	}

	async resolveTunnels(_sandboxId: string): Promise<{ openCodeUrl: string; previewUrl: string }> {
		throw createUnsupportedError("resolveTunnels");
	}

	async readFiles(_sandboxId: string, _folderPath: string): Promise<FileContent[]> {
		throw createUnsupportedError("readFiles");
	}

	async testServiceCommands(
		_sandboxId: string,
		_commands: ConfigurationServiceCommand[],
		_opts: { timeoutMs: number; runId: string },
	): Promise<AutoStartOutputEntry[]> {
		throw createUnsupportedError("testServiceCommands");
	}

	async execCommand(
		_sandboxId: string,
		_argv: string[],
		_opts?: {
			cwd?: string;
			timeoutMs?: number;
			env?: Record<string, string>;
		},
	): Promise<{ stdout: string; stderr: string; exitCode: number }> {
		throw createUnsupportedError("execCommand");
	}
}
