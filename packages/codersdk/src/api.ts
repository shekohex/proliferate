/**
 * @file Coder is starting to import the Coder API file into more and more
 * external projects, as a "pseudo-SDK". We are not at a stage where we are
 * ready to commit to maintaining a public SDK, but we need equivalent
 * functionality in other places.
 *
 * Message somebody from Team Blueberry if you need more context, but so far,
 * these projects are importing the file:
 *
 * - The Coder VS Code extension
 *   @see {@link https://github.com/coder/vscode-coder}
 * - The Coder Backstage plugin
 *   @see {@link https://github.com/coder/backstage-plugins}
 *
 * It is important that this file not do any aliased imports, or else the other
 * consumers could break ( particularly for platforms that limit how much you can
 * touch their configuration files, like Backstage ). Relative imports are still
 * safe, though.
 *
 * For example, `utils/delay` must be imported using `../utils/delay` instead.
 */
import { type ApiErrorResponse, CoderError, type FieldError } from "./errors";
import type {
	DeleteExternalAuthByIDResponse,
	DynamicParametersRequest,
	PostWorkspaceUsageRequest,
} from "./typesGenerated";
import * as TypesGen from "./typesGenerated";
import { OneWayWebSocket } from "./utils/OneWayWebSocket";
import { delay } from "./utils/delay";

const getMissingParameters = (
	oldBuildParameters: TypesGen.WorkspaceBuildParameter[],
	newBuildParameters: TypesGen.WorkspaceBuildParameter[],
	templateParameters: TypesGen.TemplateVersionParameter[],
) => {
	const missingParameters: TypesGen.TemplateVersionParameter[] = [];
	const requiredParameters: TypesGen.TemplateVersionParameter[] = [];

	for (const p of templateParameters) {
		// It is mutable and required. Mutable values can be changed after so we
		// don't need to ask them if they are not required.
		const isMutableAndRequired = p.mutable && p.required;
		// Is immutable, so we can check if it is its first time on the build
		const isImmutable = !p.mutable;

		if (isMutableAndRequired || isImmutable) {
			requiredParameters.push(p);
		}
	}

	for (const parameter of requiredParameters) {
		// Check if there is a new value
		let buildParameter = newBuildParameters.find((p) => p.name === parameter.name);

		// If not, get the old one
		if (!buildParameter) {
			buildParameter = oldBuildParameters.find((p) => p.name === parameter.name);
		}

		// If there is a value from the new or old one, it is not missed
		if (buildParameter) {
			continue;
		}

		missingParameters.push(parameter);
	}

	// Check if parameter "options" changed and we can't use old build parameters.
	for (const templateParameter of templateParameters) {
		if (templateParameter.options.length === 0) {
			continue;
		}
		// For multi-select, extra steps are necessary to JSON parse the value.
		if (templateParameter.form_type === "multi-select") {
			continue;
		}
		let buildParameter = newBuildParameters.find((p) => p.name === templateParameter.name);

		// If not, get the old one
		if (!buildParameter) {
			buildParameter = oldBuildParameters.find((p) => p.name === templateParameter.name);
		}

		if (!buildParameter) {
			continue;
		}

		const matchingOption = templateParameter.options.find(
			(option) => option.value === buildParameter?.value,
		);
		if (!matchingOption) {
			missingParameters.push(templateParameter);
		}
	}

	return missingParameters;
};

/**
 * Originally from codersdk/client.go.
 * The below declaration is required to stop Knip from complaining.
 * @public
 */
export const SessionTokenCookie = "coder_session_token";

/**
 * WebSocket compression in Safari (confirmed in 16.5) is broken when
 * the server sends large messages.
 */
const IS_SAFARI =
	typeof navigator !== "undefined" && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/**
 * @param agentId
 * @returns {OneWayWebSocket} A OneWayWebSocket that emits Server-Sent Events.
 */
export const watchAgentMetadata = (agentId: string): OneWayWebSocket<TypesGen.ServerSentEvent> => {
	return new OneWayWebSocket({
		apiRoute: `/api/v2/workspaceagents/${agentId}/watch-metadata-ws`,
	});
};

/**
 * @returns {OneWayWebSocket} A OneWayWebSocket that emits Server-Sent Events.
 */
export const watchWorkspace = (workspaceId: string): OneWayWebSocket<TypesGen.ServerSentEvent> => {
	return new OneWayWebSocket({
		apiRoute: `/api/v2/workspaces/${workspaceId}/watch-ws`,
	});
};

export const watchAgentContainers = (
	agentId: string,
): OneWayWebSocket<TypesGen.WorkspaceAgentListContainersResponse> => {
	return new OneWayWebSocket({
		apiRoute: `/api/v2/workspaceagents/${agentId}/containers/watch`,
	});
};

type WatchInboxNotificationsParams = Readonly<{
	read_status?: "read" | "unread" | "all";
}>;

export function watchInboxNotifications(
	params?: WatchInboxNotificationsParams,
): OneWayWebSocket<TypesGen.GetInboxNotificationResponse> {
	return new OneWayWebSocket({
		apiRoute: "/api/v2/notifications/inbox/watch",
		searchParams: params,
	});
}

export const getURLWithSearchParams = (basePath: string, options?: SearchParamOptions): string => {
	if (!options) {
		return basePath;
	}

	const searchParams = new URLSearchParams();
	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined && value !== "") {
			searchParams.append(key, value.toString());
		}
	}

	const searchString = searchParams.toString();
	return searchString ? `${basePath}?${searchString}` : basePath;
};

// withDefaultFeatures sets all unspecified features to not_entitled and
// disabled.
export const withDefaultFeatures = (
	fs: Partial<TypesGen.Entitlements["features"]>,
): TypesGen.Entitlements["features"] => {
	for (const feature of TypesGen.FeatureNames) {
		// Skip fields that are already filled.
		if (fs[feature] !== undefined) {
			continue;
		}

		fs[feature] = {
			enabled: false,
			entitlement: "not_entitled",
		};
	}

	return fs as TypesGen.Entitlements["features"];
};

type WatchBuildLogsByTemplateVersionIdOptions = {
	after?: number;
	onMessage: (log: TypesGen.ProvisionerJobLog) => void;
	onDone?: () => void;
	onError: (error: Error) => void;
};

export const watchBuildLogsByTemplateVersionId = (
	versionId: string,
	{ onMessage, onDone, onError, after }: WatchBuildLogsByTemplateVersionIdOptions,
) => {
	const searchParams = new URLSearchParams({ follow: "true" });
	if (after !== undefined) {
		searchParams.append("after", after.toString());
	}

	const socket = createWebSocket(`/api/v2/templateversions/${versionId}/logs`, searchParams);

	socket.addEventListener("message", (event) =>
		onMessage(JSON.parse(event.data) as TypesGen.ProvisionerJobLog),
	);

	socket.addEventListener("error", () => {
		onError(new Error("Connection for logs failed."));
		socket.close();
	});

	socket.addEventListener("close", () => {
		// When the socket closes, logs have finished streaming!
		onDone?.();
	});

	return socket;
};

export const watchWorkspaceAgentLogs = (
	agentId: string,
	params?: WatchWorkspaceAgentLogsParams,
) => {
	const searchParams = new URLSearchParams({
		follow: "true",
		after: params?.after?.toString() ?? "",
	});

	/**
	 * WebSocket compression in Safari (confirmed in 16.5) is broken when
	 * the server sends large messages. The following error is seen:
	 * WebSocket connection to 'wss://...' failed: The operation couldn't be completed.
	 */
	if (IS_SAFARI) {
		searchParams.set("no_compression", "");
	}

	return new OneWayWebSocket<TypesGen.WorkspaceAgentLog[]>({
		apiRoute: `/api/v2/workspaceagents/${agentId}/logs`,
		searchParams,
	});
};

type WatchWorkspaceAgentLogsParams = {
	after?: number;
};

type WatchBuildLogsByBuildIdOptions = {
	after?: number;
	onMessage: (log: TypesGen.ProvisionerJobLog) => void;
	onDone?: () => void;
	onError?: (error: Error) => void;
};
export const watchBuildLogsByBuildId = (
	buildId: string,
	{ onMessage, onDone, onError, after }: WatchBuildLogsByBuildIdOptions,
) => {
	const searchParams = new URLSearchParams({ follow: "true" });
	if (after !== undefined) {
		searchParams.append("after", after.toString());
	}

	const socket = createWebSocket(`/api/v2/workspacebuilds/${buildId}/logs`, searchParams);

	socket.addEventListener("message", (event) =>
		onMessage(JSON.parse(event.data) as TypesGen.ProvisionerJobLog),
	);

	socket.addEventListener("error", () => {
		if (socket.readyState === socket.CLOSED) {
			return;
		}
		onError?.(new Error("Connection for logs failed."));
		socket.close();
	});

	socket.addEventListener("close", () => {
		// When the socket closes, logs have finished streaming!
		onDone?.();
	});

	return socket;
};

export type GetTemplatesOptions = Readonly<{
	readonly deprecated?: boolean;
}>;

export type GetTemplatesQuery = Readonly<{
	readonly q: string;
}>;

function normalizeGetTemplatesOptions(
	options: GetTemplatesOptions | GetTemplatesQuery = {},
): Record<string, string> {
	if ("q" in options) {
		return options;
	}

	const params: Record<string, string> = {};
	if (options.deprecated !== undefined) {
		params.deprecated = String(options.deprecated);
	}
	return params;
}

type SearchParamOptions = TypesGen.Pagination & {
	q?: string;
};

type RestartWorkspaceParameters = Readonly<{
	workspace: TypesGen.Workspace;
	buildParameters?: TypesGen.WorkspaceBuildParameter[];
}>;

export type DeleteWorkspaceOptions = Pick<
	TypesGen.CreateWorkspaceBuildRequest,
	"log_level" | "orphan"
>;

export type DeploymentConfig = Readonly<{
	config: TypesGen.DeploymentValues;
	options: TypesGen.SerpentOption[];
}>;

type Claims = {
	license_expires: number;
	// nbf is a standard JWT claim for "not before" - the license valid from date
	nbf?: number;
	account_type?: string;
	account_id?: string;
	trial: boolean;
	all_features: boolean;
	// feature_set is omitted on legacy licenses
	feature_set?: string;
	version: number;
	features: Record<string, number>;
	require_telemetry?: boolean;
};

export type GetLicensesResponse = Omit<TypesGen.License, "claims"> & {
	claims: Claims;
	expires_at: string;
};

export type InsightsParams = {
	start_time: string;
	end_time: string;
	template_ids: string;
};

export type InsightsTemplateParams = InsightsParams & {
	interval: "day" | "week";
};

export class MissingBuildParameters extends Error {
	parameters: TypesGen.TemplateVersionParameter[] = [];
	versionId: string;

	constructor(parameters: TypesGen.TemplateVersionParameter[], versionId: string) {
		super("Missing build parameters.");
		this.parameters = parameters;
		this.versionId = versionId;
	}
}

export class ParameterValidationError extends Error {
	constructor(
		public readonly versionId: string,
		public readonly validations: FieldError[],
	) {
		super("Parameters are not valid for new template version");
	}
}

export type GetProvisionerJobsParams = {
	status?: string;
	limit?: number;
	// IDs separated by comma
	ids?: string;
};

export type GetProvisionerDaemonsParams = {
	// IDs separated by comma
	ids?: string;
	// Stringified JSON Object
	tags?: string;
	limit?: number;
	// Include offline provisioner daemons?
	offline?: boolean;
};

export type RequestParams = Record<string, string | number | boolean | undefined | null>;

export type RequestConfig = {
	baseURL?: string;
	headers?: Record<string, string>;
};

/**
 * This is the container for all API methods.
 */
class ApiMethods {
	experimental: ExperimentalApiMethods;

	constructor(protected readonly config: RequestConfig) {
		this.experimental = new ExperimentalApiMethods(this.config);
	}

	protected async request<T>(
		method: string,
		url: string,
		options: {
			body?: unknown;
			params?: RequestParams;
			headers?: Record<string, string>;
			signal?: AbortSignal;
			responseType?: "json" | "text" | "blob" | "arraybuffer";
		} = {},
	): Promise<T> {
		const fullUrl = new URL(
			getURLWithSearchParams(
				url,
				options.params as Record<string, string | number | boolean | undefined | null>,
			),
			this.config.baseURL ||
				(typeof location !== "undefined" ? location.origin : "http://localhost"),
		);

		const headers = {
			...this.config.headers,
			...options.headers,
		};

		let body: BodyInit | undefined;
		if (options.body) {
			if (options.body instanceof File || options.body instanceof Blob) {
				body = options.body;
			} else {
				body = JSON.stringify(options.body);
				headers["Content-Type"] = "application/json";
			}
		}

		const response = await fetch(fullUrl.toString(), {
			method,
			headers,
			body,
			signal: options.signal,
		});

		if (!response.ok && response.status !== 304) {
			let errorData: ApiErrorResponse;
			try {
				errorData = (await response.json()) as ApiErrorResponse;
			} catch {
				errorData = { message: response.statusText };
			}
			throw new CoderError(response, errorData);
		}

		if (response.status === 204 || method === "DELETE") {
			return undefined as T;
		}

		switch (options.responseType) {
			case "text":
				return (await response.text()) as T;
			case "blob":
				return (await response.blob()) as T;
			case "arraybuffer":
				return (await response.arrayBuffer()) as T;
			default:
				return (await response.json()) as T;
		}
	}

	login = async (email: string, password: string): Promise<TypesGen.LoginWithPasswordResponse> => {
		return this.request("POST", "/api/v2/users/login", {
			body: { email, password },
		});
	};

	convertToOAUTH = async (request: TypesGen.ConvertLoginRequest) => {
		return this.request("POST", "/api/v2/users/me/convert-login", {
			body: request,
		});
	};

	logout = async (): Promise<void> => {
		return this.request("POST", "/api/v2/users/logout");
	};

	getAuthenticatedUser = async () => {
		return this.request<TypesGen.User>("GET", "/api/v2/users/me");
	};

	getUserParameters = async (templateID: string) => {
		return this.request<TypesGen.UserParameter[]>("GET", "/api/v2/users/me/autofill-parameters", {
			params: { template_id: templateID },
		});
	};

	getAuthMethods = async (): Promise<TypesGen.AuthMethods> => {
		return this.request<TypesGen.AuthMethods>("GET", "/api/v2/users/authmethods");
	};

	getUserLoginType = async (): Promise<TypesGen.UserLoginType> => {
		return this.request<TypesGen.UserLoginType>("GET", "/api/v2/users/me/login-type");
	};

	checkAuthorization = async <TResponse extends TypesGen.AuthorizationResponse>(
		params: TypesGen.AuthorizationRequest,
	) => {
		return this.request<TResponse>("POST", "/api/v2/authcheck", {
			body: params,
		});
	};

	getApiKey = async (): Promise<TypesGen.GenerateAPIKeyResponse> => {
		return this.request<TypesGen.GenerateAPIKeyResponse>("POST", "/api/v2/users/me/keys");
	};

	getTokens = async (params: TypesGen.TokensFilter): Promise<TypesGen.APIKeyWithOwner[]> => {
		try {
			return await this.request<TypesGen.APIKeyWithOwner[]>("GET", "/api/v2/users/me/keys/tokens", {
				params: params as unknown as RequestParams,
			});
		} catch (error) {
			if (error instanceof CoderError && error.status === 404) {
				return [];
			}
			throw error;
		}
	};

	deleteToken = async (keyId: string): Promise<void> => {
		await this.request("DELETE", `/api/v2/users/me/keys/${keyId}`);
	};

	createToken = async (
		params: TypesGen.CreateTokenRequest,
	): Promise<TypesGen.GenerateAPIKeyResponse> => {
		return this.request("POST", "/api/v2/users/me/keys/tokens", {
			body: params,
		});
	};

	getTokenConfig = async (): Promise<TypesGen.TokenConfig> => {
		return this.request("GET", "/api/v2/users/me/keys/tokens/tokenconfig");
	};

	getUsers = async (
		options: TypesGen.UsersRequest = {},
		signal?: AbortSignal,
	): Promise<TypesGen.GetUsersResponse> => {
		return this.request<TypesGen.GetUsersResponse>("GET", "/api/v2/users", {
			params: options as RequestParams,
			signal,
		});
	};

	createOrganization = async (params: TypesGen.CreateOrganizationRequest) => {
		return this.request<TypesGen.Organization>("POST", "/api/v2/organizations", {
			body: params,
		});
	};

	updateOrganization = async (organization: string, params: TypesGen.UpdateOrganizationRequest) => {
		return this.request<TypesGen.Organization>("PATCH", `/api/v2/organizations/${organization}`, {
			body: params,
		});
	};

	deleteOrganization = async (organization: string) => {
		await this.request("DELETE", `/api/v2/organizations/${organization}`);
	};

	getOrganization = async (organization: string): Promise<TypesGen.Organization> => {
		return this.request<TypesGen.Organization>("GET", `/api/v2/organizations/${organization}`);
	};

	getOrganizationMembers = async (
		organization: string,
		options: Partial<TypesGen.OrganizationMembersQuery> = {},
	): Promise<TypesGen.OrganizationMemberWithUserData[]> => {
		return this.request<TypesGen.OrganizationMemberWithUserData[]>(
			"GET",
			`/api/v2/organizations/${organization}/members`,
			{ params: options as unknown as RequestParams },
		);
	};

	getOrganizationPaginatedMembers = async (organization: string, options?: TypesGen.Pagination) => {
		return this.request<TypesGen.PaginatedMembersResponse>(
			"GET",
			`/api/v2/organizations/${organization}/paginated-members`,
			{ params: options as RequestParams },
		);
	};

	getOrganizationRoles = async (organization: string) => {
		return this.request<TypesGen.AssignableRoles[]>(
			"GET",
			`/api/v2/organizations/${organization}/members/roles`,
		);
	};

	updateOrganizationMemberRoles = async (
		organization: string,
		userId: string,
		roles: TypesGen.SlimRole["name"][],
	): Promise<TypesGen.User> => {
		return this.request<TypesGen.User>(
			"PUT",
			`/api/v2/organizations/${organization}/members/${userId}/roles`,
			{ body: { roles } },
		);
	};

	createOrganizationRole = async (
		organization: string,
		role: TypesGen.Role,
	): Promise<TypesGen.Role> => {
		return this.request<TypesGen.Role>(
			"POST",
			`/api/v2/organizations/${organization}/members/roles`,
			{ body: role },
		);
	};

	updateOrganizationRole = async (
		organization: string,
		role: TypesGen.Role,
	): Promise<TypesGen.Role> => {
		return this.request<TypesGen.Role>(
			"PUT",
			`/api/v2/organizations/${organization}/members/roles`,
			{ body: role },
		);
	};

	deleteOrganizationRole = async (organization: string, roleName: string) => {
		await this.request("DELETE", `/api/v2/organizations/${organization}/members/roles/${roleName}`);
	};

	addOrganizationMember = async (organization: string, userId: string) => {
		return this.request<TypesGen.OrganizationMember>(
			"POST",
			`/api/v2/organizations/${organization}/members/${userId}`,
		);
	};

	removeOrganizationMember = async (organization: string, userId: string) => {
		await this.request("DELETE", `/api/v2/organizations/${organization}/members/${userId}`);
	};

	getOrganizations = async (): Promise<TypesGen.Organization[]> => {
		return this.request<TypesGen.Organization[]>("GET", "/api/v2/organizations");
	};

	getMyOrganizations = async (): Promise<TypesGen.Organization[]> => {
		return this.request<TypesGen.Organization[]>("GET", "/api/v2/users/me/organizations");
	};

	getOrganizationProvisionerDaemons = async (
		organization: string,
		params: GetProvisionerDaemonsParams = {},
	): Promise<TypesGen.ProvisionerDaemon[]> => {
		return this.request<TypesGen.ProvisionerDaemon[]>(
			"GET",
			`/api/v2/organizations/${organization}/provisionerdaemons`,
			{ params: params as RequestParams },
		);
	};

	getProvisionerDaemonGroupsByOrganization = async (
		organization: string,
	): Promise<TypesGen.ProvisionerKeyDaemons[]> => {
		return this.request<TypesGen.ProvisionerKeyDaemons[]>(
			"GET",
			`/api/v2/organizations/${organization}/provisionerkeys/daemons`,
		);
	};

	getOrganizationIdpSyncSettings = async (): Promise<TypesGen.OrganizationSyncSettings> => {
		return this.request<TypesGen.OrganizationSyncSettings>(
			"GET",
			"/api/v2/settings/idpsync/organization",
		);
	};

	patchOrganizationIdpSyncSettings = async (data: TypesGen.OrganizationSyncSettings) => {
		return this.request<TypesGen.Response>("PATCH", "/api/v2/settings/idpsync/organization", {
			body: data,
		});
	};

	patchGroupIdpSyncSettings = async (data: TypesGen.GroupSyncSettings, organization: string) => {
		return this.request<TypesGen.Response>(
			"PATCH",
			`/api/v2/organizations/${organization}/settings/idpsync/groups`,
			{ body: data },
		);
	};

	patchRoleIdpSyncSettings = async (data: TypesGen.RoleSyncSettings, organization: string) => {
		return this.request<TypesGen.Response>(
			"PATCH",
			`/api/v2/organizations/${organization}/settings/idpsync/roles`,
			{ body: data },
		);
	};

	getGroupIdpSyncSettingsByOrganization = async (
		organization: string,
	): Promise<TypesGen.GroupSyncSettings> => {
		return this.request<TypesGen.GroupSyncSettings>(
			"GET",
			`/api/v2/organizations/${organization}/settings/idpsync/groups`,
		);
	};

	getRoleIdpSyncSettingsByOrganization = async (
		organization: string,
	): Promise<TypesGen.RoleSyncSettings> => {
		return this.request<TypesGen.RoleSyncSettings>(
			"GET",
			`/api/v2/organizations/${organization}/settings/idpsync/roles`,
		);
	};

	getDeploymentIdpSyncFieldValues = async (field: string): Promise<readonly string[]> => {
		return this.request<readonly string[]>("GET", "/api/v2/settings/idpsync/field-values", {
			params: { claimField: field },
		});
	};

	getOrganizationIdpSyncClaimFieldValues = async (organization: string, field: string) => {
		return this.request<readonly string[]>(
			"GET",
			`/api/v2/organizations/${organization}/settings/idpsync/field-values`,
			{ params: { claimField: field } },
		);
	};

	getTemplate = async (templateId: string): Promise<TypesGen.Template> => {
		return this.request<TypesGen.Template>("GET", `/api/v2/templates/${templateId}`);
	};

	getTemplates = async (
		options?: GetTemplatesOptions | GetTemplatesQuery,
	): Promise<TypesGen.Template[]> => {
		const params = normalizeGetTemplatesOptions(options);
		return this.request<TypesGen.Template[]>("GET", "/api/v2/templates", {
			params: params as Record<string, string | number | boolean | undefined | null>,
		});
	};

	getOrganizationTemplates = async (
		organization: string,
		options: GetTemplatesOptions = {},
	): Promise<TypesGen.Template[]> => {
		const params = normalizeGetTemplatesOptions(options);
		return this.request<TypesGen.Template[]>(
			"GET",
			`/api/v2/organizations/${organization}/templates`,
			{ params: params as RequestParams },
		);
	};

	getTemplateByName = async (organization: string, name: string): Promise<TypesGen.Template> => {
		return this.request<TypesGen.Template>(
			"GET",
			`/api/v2/organizations/${organization}/templates/${name}`,
		);
	};

	getTemplateVersion = async (versionId: string): Promise<TypesGen.TemplateVersion> => {
		return this.request<TypesGen.TemplateVersion>("GET", `/api/v2/templateversions/${versionId}`);
	};

	getTemplateVersionResources = async (
		versionId: string,
	): Promise<TypesGen.WorkspaceResource[]> => {
		return this.request<TypesGen.WorkspaceResource[]>(
			"GET",
			`/api/v2/templateversions/${versionId}/resources`,
		);
	};

	getTemplateVersionVariables = async (
		versionId: string,
	): Promise<TypesGen.TemplateVersionVariable[]> => {
		return this.request<TypesGen.TemplateVersionVariable[]>(
			"GET",
			`/api/v2/templateversions/${versionId}/variables`,
		);
	};

	getTemplateVersions = async (templateId: string): Promise<TypesGen.TemplateVersion[]> => {
		return this.request<TypesGen.TemplateVersion[]>(
			"GET",
			`/api/v2/templates/${templateId}/versions`,
		);
	};

	getTemplateVersionByName = async (
		organization: string,
		templateName: string,
		versionName: string,
	): Promise<TypesGen.TemplateVersion> => {
		return this.request<TypesGen.TemplateVersion>(
			"GET",
			`/api/v2/organizations/${organization}/templates/${templateName}/versions/${versionName}`,
		);
	};

	getPreviousTemplateVersionByName = async (
		organization: string,
		templateName: string,
		versionName: string,
	) => {
		try {
			return await this.request<TypesGen.TemplateVersion>(
				"GET",
				`/api/v2/organizations/${organization}/templates/${templateName}/versions/${versionName}/previous`,
			);
		} catch (error) {
			if (error instanceof CoderError && error.status === 404) {
				return undefined;
			}
			throw error;
		}
	};

	createTemplateVersion = async (
		organization: string,
		data: TypesGen.CreateTemplateVersionRequest,
	): Promise<TypesGen.TemplateVersion> => {
		return this.request<TypesGen.TemplateVersion>(
			"POST",
			`/api/v2/organizations/${organization}/templateversions`,
			{ body: data },
		);
	};

	getTemplateVersionExternalAuth = async (
		versionId: string,
	): Promise<TypesGen.TemplateVersionExternalAuth[]> => {
		return this.request<TypesGen.TemplateVersionExternalAuth[]>(
			"GET",
			`/api/v2/templateversions/${versionId}/external-auth`,
		);
	};

	getTemplateVersionDynamicParameters = async (
		versionId: string,
		data: TypesGen.DynamicParametersRequest,
	): Promise<TypesGen.DynamicParametersResponse> => {
		return this.request<TypesGen.DynamicParametersResponse>(
			"POST",
			`/api/v2/templateversions/${versionId}/dynamic-parameters/evaluate`,
			{ body: data },
		);
	};

	getTemplateVersionRichParameters = async (
		versionId: string,
	): Promise<TypesGen.TemplateVersionParameter[]> => {
		return this.request<TypesGen.TemplateVersionParameter[]>(
			"GET",
			`/api/v2/templateversions/${versionId}/rich-parameters`,
		);
	};

	templateVersionDynamicParameters = (
		versionId: string,
		userId: string,
		{
			onMessage,
			onError,
			onClose,
		}: {
			onMessage: (response: TypesGen.DynamicParametersResponse) => void;
			onError: (error: Error) => void;
			onClose: () => void;
		},
	): WebSocket => {
		const socket = createWebSocket(
			`/api/v2/templateversions/${versionId}/dynamic-parameters`,
			new URLSearchParams({ user_id: userId }),
		);

		socket.addEventListener("message", (event) =>
			onMessage(JSON.parse(event.data) as TypesGen.DynamicParametersResponse),
		);

		socket.addEventListener("error", () => {
			onError(new Error("Connection for dynamic parameters failed."));
			socket.close();
		});

		socket.addEventListener("close", () => {
			onClose();
		});

		return socket;
	};

	createTemplate = async (
		organization: string,
		data: TypesGen.CreateTemplateRequest,
	): Promise<TypesGen.Template> => {
		return this.request<TypesGen.Template>(
			"POST",
			`/api/v2/organizations/${organization}/templates`,
			{ body: data },
		);
	};

	updateActiveTemplateVersion = async (
		templateId: string,
		data: TypesGen.UpdateActiveTemplateVersion,
	) => {
		return this.request<TypesGen.Response>("PATCH", `/api/v2/templates/${templateId}/versions`, {
			body: data,
		});
	};

	patchTemplateVersion = async (
		templateVersionId: string,
		data: TypesGen.PatchTemplateVersionRequest,
	) => {
		return this.request<TypesGen.TemplateVersion>(
			"PATCH",
			`/api/v2/templateversions/${templateVersionId}`,
			{ body: data },
		);
	};

	archiveTemplateVersion = async (templateVersionId: string) => {
		return this.request<TypesGen.TemplateVersion>(
			"POST",
			`/api/v2/templateversions/${templateVersionId}/archive`,
		);
	};

	unarchiveTemplateVersion = async (templateVersionId: string) => {
		return this.request<TypesGen.TemplateVersion>(
			"POST",
			`/api/v2/templateversions/${templateVersionId}/unarchive`,
		);
	};

	downloadTemplateVersion = async (fileId: string, format?: "zip"): Promise<Blob> => {
		return this.request<Blob>("GET", `/api/v2/files/${fileId}`, {
			params: format ? { format } : undefined,
			responseType: "blob",
		});
	};

	updateTemplateMeta = async (
		templateId: string,
		data: TypesGen.UpdateTemplateMeta,
	): Promise<TypesGen.Template | null> => {
		try {
			return await this.request<TypesGen.Template>("PATCH", `/api/v2/templates/${templateId}`, {
				body: data,
			});
		} catch (error) {
			if (error instanceof CoderError && error.status === 304) {
				return null;
			}
			throw error;
		}
	};

	deleteTemplate = async (templateId: string): Promise<TypesGen.Template> => {
		return this.request<TypesGen.Template>("DELETE", `/api/v2/templates/${templateId}`);
	};

	invalidateTemplatePresets = async (
		templateId: string,
	): Promise<TypesGen.InvalidatePresetsResponse> => {
		return this.request<TypesGen.InvalidatePresetsResponse>(
			"POST",
			`/api/v2/templates/${templateId}/prebuilds/invalidate`,
		);
	};

	getWorkspace = async (
		workspaceId: string,
		params: TypesGen.WorkspacesRequest = {},
	): Promise<TypesGen.Workspace> => {
		return this.request<TypesGen.Workspace>("GET", `/api/v2/workspaces/${workspaceId}`, {
			params: params as RequestParams,
		});
	};

	getWorkspaces = async (
		req: TypesGen.WorkspacesRequest = {},
	): Promise<TypesGen.WorkspacesResponse> => {
		return this.request<TypesGen.WorkspacesResponse>("GET", "/api/v2/workspaces", {
			params: req as RequestParams,
		});
	};

	getOrganizationWorkspaceByUserAndName = async (
		username: string,
		workspaceName: string,
		params: TypesGen.WorkspacesRequest = {},
	): Promise<TypesGen.Workspace> => {
		return this.request<TypesGen.Workspace>(
			"GET",
			`/api/v2/users/${username}/workspace/${workspaceName}`,
			{
				params: params as RequestParams,
			},
		);
	};

	getOrganizationWorkspaceByOwnerAndName = async (
		username: string,
		workspaceName: string,
		params?: TypesGen.WorkspaceOptions,
	): Promise<TypesGen.Workspace> => {
		return this.request<TypesGen.Workspace>(
			"GET",
			`/api/v2/users/${username}/workspace/${workspaceName}`,
			{ params: params as unknown as RequestParams },
		);
	};

	getWorkspaceBuildByNumber = async (
		username: string,
		workspaceName: string,
		buildNumber: number,
	): Promise<TypesGen.WorkspaceBuild> => {
		return this.request<TypesGen.WorkspaceBuild>(
			"GET",
			`/api/v2/users/${username}/workspace/${workspaceName}/builds/${buildNumber}`,
		);
	};

	waitForBuild = (build: TypesGen.WorkspaceBuild) => {
		return new Promise<TypesGen.ProvisionerJob | undefined>((res, reject) => {
			void (async () => {
				let latestJobInfo: TypesGen.ProvisionerJob | undefined;

				while (
					!["succeeded", "canceled"].some((status) => latestJobInfo?.status.includes(status))
				) {
					const buildInfo = await this.getWorkspaceBuildByNumber(
						build.workspace_owner_name,
						build.workspace_name,
						build.build_number,
					);
					const { job } = buildInfo;

					latestJobInfo = job;
					if (latestJobInfo.status === "failed") {
						return reject(latestJobInfo);
					}

					await delay(1000);
				}

				return res(latestJobInfo);
			})();
		});
	};

	postWorkspaceBuild = async (
		workspaceId: string,
		data: TypesGen.CreateWorkspaceBuildRequest,
	): Promise<TypesGen.WorkspaceBuild> => {
		return this.request<TypesGen.WorkspaceBuild>(
			"POST",
			`/api/v2/workspaces/${workspaceId}/builds`,
			{ body: data },
		);
	};

	getTemplateVersionPresets = async (
		templateVersionId: string,
	): Promise<TypesGen.Preset[] | null> => {
		return this.request<TypesGen.Preset[] | null>(
			"GET",
			`/api/v2/templateversions/${templateVersionId}/presets`,
		);
	};

	startWorkspace = (
		workspaceId: string,
		templateVersionId: string,
		logLevel?: TypesGen.ProvisionerLogLevel,
		buildParameters?: TypesGen.WorkspaceBuildParameter[],
	) => {
		return this.postWorkspaceBuild(workspaceId, {
			transition: "start",
			template_version_id: templateVersionId,
			log_level: logLevel,
			rich_parameter_values: buildParameters,
			reason: "dashboard",
		});
	};

	stopWorkspace = (workspaceId: string, logLevel?: TypesGen.ProvisionerLogLevel) => {
		return this.postWorkspaceBuild(workspaceId, {
			transition: "stop",
			log_level: logLevel,
		});
	};

	deleteWorkspace = (workspaceId: string, options?: DeleteWorkspaceOptions) => {
		return this.postWorkspaceBuild(workspaceId, {
			transition: "delete",
			...options,
		});
	};

	cancelWorkspaceBuild = async (
		workspaceBuildId: string,
		params: Partial<TypesGen.WorkspaceBuildsRequest> = {},
	): Promise<TypesGen.WorkspaceBuild> => {
		return this.request<TypesGen.WorkspaceBuild>(
			"PATCH",
			`/api/v2/workspacebuilds/${workspaceBuildId}/cancel`,
			{ params: params as unknown as RequestParams },
		);
	};

	updateWorkspaceDormancy = async (
		workspaceId: string,
		dormant: boolean,
	): Promise<TypesGen.Workspace> => {
		return this.request<TypesGen.Workspace>("PUT", `/api/v2/workspaces/${workspaceId}/dormant`, {
			body: { dormant },
		});
	};

	updateWorkspaceAutomaticUpdates = async (
		workspaceId: string,
		automaticUpdates: TypesGen.AutomaticUpdates,
	): Promise<void> => {
		const req: TypesGen.UpdateWorkspaceAutomaticUpdatesRequest = {
			automatic_updates: automaticUpdates,
		};

		return this.request("PUT", `/api/v2/workspaces/${workspaceId}/autoupdates`, {
			body: req,
		});
	};

	restartWorkspace = async ({
		workspace,
		buildParameters,
	}: RestartWorkspaceParameters): Promise<void> => {
		const stopBuild = await this.stopWorkspace(workspace.id);
		const awaitedStopBuild = await this.waitForBuild(stopBuild);

		// If the restart is canceled halfway through, make sure we bail
		if (awaitedStopBuild?.status === "canceled") {
			return;
		}

		const startBuild = await this.startWorkspace(
			workspace.id,
			workspace.latest_build.template_version_id,
			undefined,
			buildParameters,
		);

		await this.waitForBuild(startBuild);
	};

	cancelTemplateVersionBuild = async (templateVersionId: string): Promise<TypesGen.Response> => {
		return this.request<TypesGen.Response>(
			"PATCH",
			`/api/v2/templateversions/${templateVersionId}/cancel`,
		);
	};

	cancelTemplateVersionDryRun = async (
		templateVersionId: string,
		jobId: string,
	): Promise<TypesGen.Response> => {
		return this.request<TypesGen.Response>(
			"PATCH",
			`/api/v2/templateversions/${templateVersionId}/dry-run/${jobId}/cancel`,
		);
	};

	createUser = async (user: TypesGen.CreateUserRequestWithOrgs): Promise<TypesGen.User> => {
		return this.request<TypesGen.User>("POST", "/api/v2/users", { body: user });
	};

	createWorkspace = async (
		userId: string,
		workspace: TypesGen.CreateWorkspaceRequest,
	): Promise<TypesGen.Workspace> => {
		return this.request<TypesGen.Workspace>("POST", `/api/v2/users/${userId}/workspaces`, {
			body: workspace,
		});
	};

	patchWorkspace = async (
		workspaceId: string,
		data: TypesGen.UpdateWorkspaceRequest,
	): Promise<void> => {
		await this.request("PATCH", `/api/v2/workspaces/${workspaceId}`, {
			body: data,
		});
	};

	getBuildInfo = async (): Promise<TypesGen.BuildInfoResponse> => {
		return this.request<TypesGen.BuildInfoResponse>("GET", "/api/v2/buildinfo");
	};

	getUpdateCheck = async (): Promise<TypesGen.UpdateCheckResponse> => {
		return this.request<TypesGen.UpdateCheckResponse>("GET", "/api/v2/updatecheck");
	};

	putWorkspaceAutostart = async (
		workspaceID: string,
		autostart: TypesGen.UpdateWorkspaceAutostartRequest,
	): Promise<void> => {
		await this.request("PUT", `/api/v2/workspaces/${workspaceID}/autostart`, {
			body: autostart,
		});
	};

	putWorkspaceAutostop = async (
		workspaceID: string,
		ttl: TypesGen.UpdateWorkspaceTTLRequest,
	): Promise<void> => {
		await this.request("PUT", `/api/v2/workspaces/${workspaceID}/ttl`, {
			body: ttl,
		});
	};

	updateProfile = async (
		userId: string,
		data: TypesGen.UpdateUserProfileRequest,
	): Promise<TypesGen.User> => {
		return this.request<TypesGen.User>("PUT", `/api/v2/users/${userId}/profile`, {
			body: data,
		});
	};

	getAppearanceSettings = async (): Promise<TypesGen.UserAppearanceSettings> => {
		return this.request<TypesGen.UserAppearanceSettings>("GET", "/api/v2/users/me/appearance");
	};

	updateAppearanceSettings = async (
		data: TypesGen.UpdateUserAppearanceSettingsRequest,
	): Promise<TypesGen.UserAppearanceSettings> => {
		return this.request<TypesGen.UserAppearanceSettings>("PUT", "/api/v2/users/me/appearance", {
			body: data,
		});
	};

	getUserPreferenceSettings = async (): Promise<TypesGen.UserPreferenceSettings> => {
		return this.request<TypesGen.UserPreferenceSettings>("GET", "/api/v2/users/me/preferences");
	};

	updateUserPreferenceSettings = async (
		req: TypesGen.UpdateUserPreferenceSettingsRequest,
	): Promise<TypesGen.UserPreferenceSettings> => {
		return this.request<TypesGen.UserPreferenceSettings>("PUT", "/api/v2/users/me/preferences", {
			body: req,
		});
	};

	getUserQuietHoursSchedule = async (
		userId: TypesGen.User["id"],
	): Promise<TypesGen.UserQuietHoursScheduleResponse> => {
		return this.request<TypesGen.UserQuietHoursScheduleResponse>(
			"GET",
			`/api/v2/users/${userId}/quiet-hours`,
		);
	};

	updateUserQuietHoursSchedule = async (
		userId: TypesGen.User["id"],
		data: TypesGen.UpdateUserQuietHoursScheduleRequest,
	): Promise<TypesGen.UserQuietHoursScheduleResponse> => {
		return this.request<TypesGen.UserQuietHoursScheduleResponse>(
			"PUT",
			`/api/v2/users/${userId}/quiet-hours`,
			{ body: data },
		);
	};

	activateUser = async (userId: TypesGen.User["id"]): Promise<TypesGen.User> => {
		return this.request<TypesGen.User>("PUT", `/api/v2/users/${userId}/status/activate`);
	};

	suspendUser = async (userId: TypesGen.User["id"]): Promise<TypesGen.User> => {
		return this.request<TypesGen.User>("PUT", `/api/v2/users/${userId}/status/suspend`);
	};

	deleteUser = async (userId: TypesGen.User["id"]): Promise<void> => {
		await this.request("DELETE", `/api/v2/users/${userId}`);
	};

	hasFirstUser = async (): Promise<boolean> => {
		try {
			await this.request("GET", "/api/v2/users/first");
			return true;
		} catch (error) {
			if (error instanceof CoderError && error.status === 404) {
				return false;
			}
			throw error;
		}
	};

	createFirstUser = async (
		req: TypesGen.CreateFirstUserRequest,
	): Promise<TypesGen.CreateFirstUserResponse> => {
		return this.request<TypesGen.CreateFirstUserResponse>("POST", "/api/v2/users/first", {
			body: req,
		});
	};

	updateUserPassword = async (
		userId: TypesGen.User["id"],
		updatePassword: TypesGen.UpdateUserPasswordRequest,
	): Promise<void> => {
		await this.request("PUT", `/api/v2/users/${userId}/password`, {
			body: updatePassword,
		});
	};

	validateUserPassword = async (
		password: string,
	): Promise<TypesGen.ValidateUserPasswordResponse> => {
		return this.request<TypesGen.ValidateUserPasswordResponse>(
			"POST",
			"/api/v2/users/validate-password",
			{ body: { password } },
		);
	};

	getRoles = async (): Promise<Array<TypesGen.AssignableRoles>> => {
		return this.request<TypesGen.AssignableRoles[]>("GET", "/api/v2/users/roles");
	};

	updateUserRoles = async (
		roles: TypesGen.SlimRole["name"][],
		userId: TypesGen.User["id"],
	): Promise<TypesGen.User> => {
		return this.request<TypesGen.User>("PUT", `/api/v2/users/${userId}/roles`, {
			body: { roles },
		});
	};

	getUserSSHKey = async (userId = "me"): Promise<TypesGen.GitSSHKey> => {
		return this.request<TypesGen.GitSSHKey>("GET", `/api/v2/users/${userId}/gitsshkey`);
	};

	regenerateUserSSHKey = async (userId = "me"): Promise<TypesGen.GitSSHKey> => {
		return this.request<TypesGen.GitSSHKey>("PUT", `/api/v2/users/${userId}/gitsshkey`);
	};

	getOrganizationWorkspaceBuilds = async (
		workspaceId: string,
		req: TypesGen.WorkspaceBuildsRequest = {},
	): Promise<TypesGen.WorkspaceBuild[]> => {
		return this.request<TypesGen.WorkspaceBuild[]>(
			"GET",
			`/api/v2/workspaces/${workspaceId}/builds`,
			{ params: req as RequestParams },
		);
	};

	getWorkspaceBuildLogs = async (buildId: string): Promise<TypesGen.ProvisionerJobLog[]> => {
		return this.request<TypesGen.ProvisionerJobLog[]>(
			"GET",
			`/api/v2/workspacebuilds/${buildId}/logs`,
		);
	};

	getWorkspaceAgentLogs = async (agentID: string): Promise<TypesGen.WorkspaceAgentLog[]> => {
		return this.request<TypesGen.WorkspaceAgentLog[]>(
			"GET",
			`/api/v2/workspaceagents/${agentID}/logs`,
		);
	};

	putWorkspaceExtension = async (workspaceId: string, newDeadline: Date): Promise<void> => {
		await this.request("PUT", `/api/v2/workspaces/${workspaceId}/extend`, {
			body: { deadline: newDeadline.toISOString() },
		});
	};

	refreshEntitlements = async (): Promise<void> => {
		await this.request("POST", "/api/v2/licenses/refresh-entitlements");
	};

	getEntitlements = async (): Promise<TypesGen.Entitlements> => {
		try {
			return await this.request<TypesGen.Entitlements>("GET", "/api/v2/entitlements");
		} catch (ex) {
			if (ex instanceof CoderError && ex.status === 404) {
				return {
					errors: [],
					features: withDefaultFeatures({}),
					has_license: false,
					require_telemetry: false,
					trial: false,
					warnings: [],
					refreshed_at: "",
				};
			}
			throw ex;
		}
	};

	getExperiments = async (): Promise<TypesGen.Experiment[]> => {
		try {
			return await this.request<TypesGen.Experiment[]>("GET", "/api/v2/experiments");
		} catch (error) {
			if (error instanceof CoderError && error.status === 404) {
				return [];
			}
			throw error;
		}
	};

	getAvailableExperiments = async (): Promise<TypesGen.AvailableExperiments> => {
		try {
			return await this.request<TypesGen.AvailableExperiments>(
				"GET",
				"/api/v2/experiments/available",
			);
		} catch (error) {
			if (error instanceof CoderError && error.status === 404) {
				return { safe: [] };
			}
			throw error;
		}
	};

	getExternalAuthProvider = async (provider: string): Promise<TypesGen.ExternalAuth> => {
		return this.request<TypesGen.ExternalAuth>("GET", `/api/v2/external-auth/${provider}`);
	};

	getExternalAuthDevice = async (provider: string): Promise<TypesGen.ExternalAuthDevice> => {
		return this.request<TypesGen.ExternalAuthDevice>(
			"GET",
			`/api/v2/external-auth/${provider}/device`,
		);
	};

	exchangeExternalAuthDevice = async (
		provider: string,
		req: TypesGen.ExternalAuthDeviceExchange,
	): Promise<void> => {
		return this.request("POST", `/api/v2/external-auth/${provider}/device`, {
			body: req,
		});
	};

	getUserExternalAuthProviders = async (): Promise<TypesGen.ListUserExternalAuthResponse> => {
		return this.request<TypesGen.ListUserExternalAuthResponse>("GET", "/api/v2/external-auth");
	};

	unlinkExternalAuthProvider = async (
		provider: string,
	): Promise<DeleteExternalAuthByIDResponse> => {
		return this.request<DeleteExternalAuthByIDResponse>(
			"DELETE",
			`/api/v2/external-auth/${provider}`,
		);
	};

	getOAuth2GitHubDeviceFlowCallback = async (
		code: string,
		state: string,
	): Promise<TypesGen.OAuth2DeviceFlowCallbackResponse> => {
		const res = await this.request<TypesGen.OAuth2DeviceFlowCallbackResponse>(
			"GET",
			"/api/v2/users/oauth2/github/callback",
			{ params: { code, state } },
		);
		if (typeof res !== "object" || typeof res.redirect_url !== "string") {
			console.error("Invalid response from OAuth2 GitHub callback", res);
			throw new Error("Invalid response from OAuth2 GitHub callback");
		}
		return res;
	};

	getOAuth2GitHubDevice = async (): Promise<TypesGen.ExternalAuthDevice & { state: string }> => {
		// We first hit the callback endpoint without a code to get a valid oauth_state cookie
		// and the state parameter from the redirect URL.
		const callbackUrl = new URL(
			"/api/v2/users/oauth2/github/callback",
			this.config.baseURL ||
				(typeof location !== "undefined" ? location.origin : "http://localhost"),
		);
		const stateRes = await fetch(callbackUrl.toString(), {
			method: "GET",
			redirect: "follow",
		});
		const finalUrl = new URL(stateRes.url);
		const state = finalUrl.searchParams.get("state");

		if (!state) {
			throw new Error("Failed to get OAuth2 state from callback redirect");
		}

		const device = await this.request<TypesGen.ExternalAuthDevice>(
			"GET",
			"/api/v2/users/oauth2/github/device",
		);

		return { ...device, state };
	};

	getOAuth2ProviderApps = async (
		filter?: TypesGen.OAuth2ProviderAppFilter,
	): Promise<TypesGen.OAuth2ProviderApp[]> => {
		return this.request<TypesGen.OAuth2ProviderApp[]>("GET", "/api/v2/oauth2-provider/apps", {
			params: filter as RequestParams,
		});
	};

	getOAuth2ProviderApp = async (id: string): Promise<TypesGen.OAuth2ProviderApp> => {
		return this.request<TypesGen.OAuth2ProviderApp>("GET", `/api/v2/oauth2-provider/apps/${id}`);
	};

	postOAuth2ProviderApp = async (
		data: TypesGen.PostOAuth2ProviderAppRequest,
	): Promise<TypesGen.OAuth2ProviderApp> => {
		return this.request<TypesGen.OAuth2ProviderApp>("POST", "/api/v2/oauth2-provider/apps", {
			body: data,
		});
	};

	putOAuth2ProviderApp = async (
		id: string,
		data: TypesGen.PutOAuth2ProviderAppRequest,
	): Promise<TypesGen.OAuth2ProviderApp> => {
		return this.request<TypesGen.OAuth2ProviderApp>("PUT", `/api/v2/oauth2-provider/apps/${id}`, {
			body: data,
		});
	};

	deleteOAuth2ProviderApp = async (id: string): Promise<void> => {
		await this.request("DELETE", `/api/v2/oauth2-provider/apps/${id}`);
	};

	getOAuth2ProviderAppSecrets = async (id: string): Promise<TypesGen.OAuth2ProviderAppSecret[]> => {
		return this.request<TypesGen.OAuth2ProviderAppSecret[]>(
			"GET",
			`/api/v2/oauth2-provider/apps/${id}/secrets`,
		);
	};

	postOAuth2ProviderAppSecret = async (
		id: string,
	): Promise<TypesGen.OAuth2ProviderAppSecretFull> => {
		return this.request<TypesGen.OAuth2ProviderAppSecretFull>(
			"POST",
			`/api/v2/oauth2-provider/apps/${id}/secrets`,
		);
	};

	deleteOAuth2ProviderAppSecret = async (appId: string, secretId: string): Promise<void> => {
		await this.request("DELETE", `/api/v2/oauth2-provider/apps/${appId}/secrets/${secretId}`);
	};

	revokeOAuth2ProviderApp = async (appId: string): Promise<void> => {
		await this.request("DELETE", "/oauth2/tokens", {
			params: { client_id: appId },
		});
	};

	getAuditLogs = async (options: TypesGen.AuditLogsRequest): Promise<TypesGen.AuditLogResponse> => {
		return this.request<TypesGen.AuditLogResponse>("GET", "/api/v2/audit", {
			params: options as RequestParams,
		});
	};

	getConnectionLogs = async (
		options: TypesGen.ConnectionLogsRequest,
	): Promise<TypesGen.ConnectionLogResponse> => {
		return this.request<TypesGen.ConnectionLogResponse>("GET", "/api/v2/connectionlog", {
			params: options as RequestParams,
		});
	};

	getTemplateDAUs = async (templateId: string): Promise<TypesGen.DAUsResponse> => {
		return this.request<TypesGen.DAUsResponse>("GET", `/api/v2/templates/${templateId}/daus`);
	};

	getDeploymentDAUs = async (
		// Default to user's local timezone.
		// As /api/v2/insights/daus only accepts whole-number values for tz_offset
		// we truncate the tz offset down to the closest hour.
		offset = Math.trunc(new Date().getTimezoneOffset() / 60),
	): Promise<TypesGen.DAUsResponse> => {
		return this.request<TypesGen.DAUsResponse>("GET", "/api/v2/insights/daus", {
			params: { tz_offset: offset },
		});
	};

	getTemplateACLAvailable = async (
		templateId: string,
		options: TypesGen.UsersRequest,
	): Promise<TypesGen.ACLAvailable> => {
		return this.request<TypesGen.ACLAvailable>(
			"GET",
			`/api/v2/templates/${templateId}/acl/available`,
			{ params: options as RequestParams },
		);
	};

	getTemplateACL = async (templateId: string): Promise<TypesGen.TemplateACL> => {
		return this.request<TypesGen.TemplateACL>("GET", `/api/v2/templates/${templateId}/acl`);
	};

	updateTemplateACL = async (
		templateId: string,
		data: TypesGen.UpdateTemplateACL,
	): Promise<{ message: string }> => {
		return this.request<{ message: string }>("PATCH", `/api/v2/templates/${templateId}/acl`, {
			body: data,
		});
	};

	getWorkspaceACL = async (workspaceId: string): Promise<TypesGen.WorkspaceACL> => {
		return this.request<TypesGen.WorkspaceACL>("GET", `/api/v2/workspaces/${workspaceId}/acl`);
	};

	updateWorkspaceACL = async (
		workspaceId: string,
		data: TypesGen.UpdateWorkspaceACL,
	): Promise<void> => {
		await this.request("PATCH", `/api/v2/workspaces/${workspaceId}/acl`, {
			body: data,
		});
	};

	getApplicationsHost = async (): Promise<TypesGen.AppHostResponse> => {
		return this.request<TypesGen.AppHostResponse>("GET", "/api/v2/applications/host");
	};

	getGroups = async (options: { userId?: string } = {}): Promise<TypesGen.Group[]> => {
		const params: Record<string, string> = {};
		if (options.userId !== undefined) {
			params.has_member = options.userId;
		}

		return this.request<TypesGen.Group[]>("GET", "/api/v2/groups", { params });
	};

	getOrganizationGroups = async (organization: string): Promise<TypesGen.Group[]> => {
		return this.request<TypesGen.Group[]>("GET", `/api/v2/organizations/${organization}/groups`);
	};

	createGroup = async (
		organization: string,
		data: TypesGen.CreateGroupRequest,
	): Promise<TypesGen.Group> => {
		return this.request<TypesGen.Group>("POST", `/api/v2/organizations/${organization}/groups`, {
			body: data,
		});
	};

	getOrganizationGroup = async (
		organization: string,
		groupName: string,
	): Promise<TypesGen.Group> => {
		return this.request<TypesGen.Group>(
			"GET",
			`/api/v2/organizations/${organization}/groups/${groupName}`,
		);
	};

	patchGroup = async (
		groupId: string,
		data: TypesGen.PatchGroupRequest,
	): Promise<TypesGen.Group> => {
		return this.request<TypesGen.Group>("PATCH", `/api/v2/groups/${groupId}`, {
			body: data,
		});
	};

	addMember = async (groupId: string, userId: string) => {
		return this.patchGroup(groupId, {
			name: "",
			add_users: [userId],
			remove_users: [],
			display_name: null,
			avatar_url: null,
			quota_allowance: null,
		});
	};

	removeMember = async (groupId: string, userId: string) => {
		return this.patchGroup(groupId, {
			name: "",
			add_users: [],
			remove_users: [userId],
			display_name: null,
			avatar_url: null,
			quota_allowance: null,
		});
	};

	deleteGroup = async (groupId: string): Promise<void> => {
		await this.request("DELETE", `/api/v2/groups/${groupId}`);
	};

	getOrganizationWorkspaceQuota = async (
		organizationName: string,
		username: string,
	): Promise<TypesGen.WorkspaceQuota> => {
		return this.request<TypesGen.WorkspaceQuota>(
			"GET",
			`/api/v2/organizations/${encodeURIComponent(organizationName)}/members/${encodeURIComponent(username)}/workspace-quota`,
		);
	};

	getAgentListeningPorts = async (
		agentID: string,
	): Promise<TypesGen.WorkspaceAgentListeningPortsResponse> => {
		return this.request<TypesGen.WorkspaceAgentListeningPortsResponse>(
			"GET",
			`/api/v2/workspaceagents/${agentID}/listening-ports`,
		);
	};

	getWorkspaceAgentSharedPorts = async (
		workspaceID: string,
	): Promise<TypesGen.WorkspaceAgentPortShares> => {
		return this.request<TypesGen.WorkspaceAgentPortShares>(
			"GET",
			`/api/v2/workspaces/${workspaceID}/port-share`,
		);
	};

	getWorkspaceAgentCredentials = async (
		workspaceID: string,
		agentName: string,
	): Promise<TypesGen.ExternalAgentCredentials> => {
		return this.request<TypesGen.ExternalAgentCredentials>(
			"GET",
			`/api/v2/workspaces/${workspaceID}/external-agent/${agentName}/credentials`,
		);
	};

	upsertWorkspaceAgentSharedPort = async (
		workspaceID: string,
		req: TypesGen.UpsertWorkspaceAgentPortShareRequest,
	): Promise<TypesGen.WorkspaceAgentPortShares> => {
		return this.request<TypesGen.WorkspaceAgentPortShares>(
			"POST",
			`/api/v2/workspaces/${workspaceID}/port-share`,
			{ body: req },
		);
	};

	deleteWorkspaceAgentSharedPort = async (
		workspaceID: string,
		req: TypesGen.DeleteWorkspaceAgentPortShareRequest,
	): Promise<TypesGen.WorkspaceAgentPortShares> => {
		return this.request<TypesGen.WorkspaceAgentPortShares>(
			"DELETE",
			`/api/v2/workspaces/${workspaceID}/port-share`,
			{ body: req },
		);
	};

	getDeploymentSSHConfig = async (): Promise<TypesGen.SSHConfigResponse> => {
		return this.request<TypesGen.SSHConfigResponse>("GET", "/api/v2/deployment/ssh");
	};

	getDeploymentConfig = async (): Promise<DeploymentConfig> => {
		return this.request<DeploymentConfig>("GET", "/api/v2/deployment/config");
	};

	getDeploymentStats = async (): Promise<TypesGen.DeploymentStats> => {
		return this.request<TypesGen.DeploymentStats>("GET", "/api/v2/deployment/stats");
	};

	getReplicas = async (): Promise<TypesGen.Replica[]> => {
		return this.request<TypesGen.Replica[]>("GET", "/api/v2/replicas");
	};

	getFile = async (fileId: string): Promise<ArrayBuffer> => {
		return this.request<ArrayBuffer>("GET", `/api/v2/files/${fileId}`, {
			responseType: "arraybuffer",
		});
	};

	getWorkspaceProxyRegions = async (): Promise<TypesGen.RegionsResponse<TypesGen.Region>> => {
		return this.request<TypesGen.RegionsResponse<TypesGen.Region>>("GET", "/api/v2/regions");
	};

	getWorkspaceProxies = async (): Promise<TypesGen.RegionsResponse<TypesGen.WorkspaceProxy>> => {
		return this.request<TypesGen.RegionsResponse<TypesGen.WorkspaceProxy>>(
			"GET",
			"/api/v2/workspaceproxies",
		);
	};

	createWorkspaceProxy = async (
		b: TypesGen.CreateWorkspaceProxyRequest,
	): Promise<TypesGen.UpdateWorkspaceProxyResponse> => {
		return this.request<TypesGen.UpdateWorkspaceProxyResponse>("POST", "/api/v2/workspaceproxies", {
			body: b,
		});
	};

	getAppearance = async (): Promise<TypesGen.AppearanceConfig> => {
		try {
			const res = await this.request<TypesGen.AppearanceConfig>("GET", "/api/v2/appearance");
			return res;
		} catch (ex) {
			if (ex instanceof CoderError && ex.status === 404) {
				return {
					application_name: "",
					docs_url: "",
					logo_url: "",
					announcement_banners: [],
					service_banner: {
						enabled: false,
					},
				};
			}
			throw ex;
		}
	};

	updateAppearance = async (b: TypesGen.AppearanceConfig): Promise<TypesGen.AppearanceConfig> => {
		return this.request<TypesGen.AppearanceConfig>("PUT", "/api/v2/appearance", {
			body: b,
		});
	};

	getTemplateExamples = async (): Promise<TypesGen.TemplateExample[]> => {
		return this.request<TypesGen.TemplateExample[]>("GET", "/api/v2/templates/examples");
	};

	uploadFile = async (file: File): Promise<TypesGen.UploadResponse> => {
		return this.request<TypesGen.UploadResponse>("POST", "/api/v2/files", {
			body: file,
			headers: { "Content-Type": file.type },
		});
	};

	getTemplateVersionLogs = async (versionId: string): Promise<TypesGen.ProvisionerJobLog[]> => {
		return this.request<TypesGen.ProvisionerJobLog[]>(
			"GET",
			`/api/v2/templateversions/${versionId}/logs`,
		);
	};

	updateWorkspaceVersion = async (
		workspace: TypesGen.Workspace,
	): Promise<TypesGen.WorkspaceBuild> => {
		const template = await this.getTemplate(workspace.template_id);
		return this.startWorkspace(workspace.id, template.active_version_id);
	};

	getWorkspaceBuildParameters = async (
		workspaceBuildId: TypesGen.WorkspaceBuild["id"],
	): Promise<TypesGen.WorkspaceBuildParameter[]> => {
		return this.request<TypesGen.WorkspaceBuildParameter[]>(
			"GET",
			`/api/v2/workspacebuilds/${workspaceBuildId}/parameters`,
		);
	};

	getLicenses = async (): Promise<GetLicensesResponse[]> => {
		return this.request<GetLicensesResponse[]>("GET", "/api/v2/licenses");
	};

	createLicense = async (data: TypesGen.AddLicenseRequest): Promise<TypesGen.AddLicenseRequest> => {
		return this.request<TypesGen.AddLicenseRequest>("POST", "/api/v2/licenses", {
			body: data,
		});
	};

	removeLicense = async (licenseId: number): Promise<void> => {
		await this.request("DELETE", `/api/v2/licenses/${licenseId}`);
	};

	getDynamicParameters = async (
		templateVersionId: string,
		ownerId: string,
		oldBuildParameters: TypesGen.WorkspaceBuildParameter[],
	) => {
		const request: DynamicParametersRequest = {
			id: 1,
			owner_id: ownerId,
			inputs: Object.fromEntries(
				new Map(oldBuildParameters.map((param) => [param.name, param.value])),
			),
		};

		const dynamicParametersResponse = await this.getTemplateVersionDynamicParameters(
			templateVersionId,
			request,
		);

		return dynamicParametersResponse.parameters.map((p) => ({
			...p,
			description_plaintext: p.description || "",
			default_value: p.default_value?.valid ? p.default_value.value : "",
			options: p.options
				? p.options.map((opt) => ({
						...opt,
						value: opt.value?.valid ? opt.value.value : "",
					}))
				: [],
		}));
	};

	changeWorkspaceVersion = async (
		workspace: TypesGen.Workspace,
		templateVersionId: string,
		newBuildParameters: TypesGen.WorkspaceBuildParameter[] = [],
		isDynamicParametersEnabled = false,
	): Promise<TypesGen.WorkspaceBuild> => {
		const currentBuildParameters = await this.getWorkspaceBuildParameters(
			workspace.latest_build.id,
		);

		let templateParameters: TypesGen.TemplateVersionParameter[] = [];
		if (isDynamicParametersEnabled) {
			templateParameters = await this.getDynamicParameters(
				templateVersionId,
				workspace.owner_id,
				currentBuildParameters,
			);
		} else {
			templateParameters = await this.getTemplateVersionRichParameters(templateVersionId);
		}

		const missingParameters = getMissingParameters(
			currentBuildParameters,
			newBuildParameters,
			templateParameters,
		);

		if (missingParameters.length > 0) {
			throw new MissingBuildParameters(missingParameters, templateVersionId);
		}

		return this.postWorkspaceBuild(workspace.id, {
			transition: "start",
			template_version_id: templateVersionId,
			rich_parameter_values: newBuildParameters,
		});
	};

	updateWorkspace = async (
		workspace: TypesGen.Workspace,
		newBuildParameters: TypesGen.WorkspaceBuildParameter[] = [],
		isDynamicParametersEnabled = false,
	): Promise<TypesGen.WorkspaceBuild> => {
		const [template, oldBuildParameters] = await Promise.all([
			this.getTemplate(workspace.template_id),
			this.getWorkspaceBuildParameters(workspace.latest_build.id),
		]);

		const activeVersionId = template.active_version_id;

		if (isDynamicParametersEnabled) {
			try {
				return await this.postWorkspaceBuild(workspace.id, {
					transition: "start",
					template_version_id: activeVersionId,
					rich_parameter_values: newBuildParameters,
				});
			} catch (error) {
				if (
					error instanceof CoderError &&
					error.status === 400 &&
					error.data.validations &&
					error.data.validations.length > 0
				) {
					throw new ParameterValidationError(activeVersionId, error.data.validations);
				}
				throw error;
			}
		}

		const templateParameters = await this.getTemplateVersionRichParameters(activeVersionId);

		const missingParameters = getMissingParameters(
			oldBuildParameters,
			newBuildParameters,
			templateParameters,
		);

		if (missingParameters.length > 0) {
			throw new MissingBuildParameters(missingParameters, activeVersionId);
		}

		if (workspace.latest_build.status === "running") {
			const stopBuild = await this.stopWorkspace(workspace.id);
			const awaitedStopBuild = await this.waitForBuild(stopBuild);
			if (awaitedStopBuild?.status === "canceled") {
				return Promise.reject(
					new Error("Workspace stop was canceled, not proceeding with update."),
				);
			}
		}

		return this.postWorkspaceBuild(workspace.id, {
			transition: "start",
			template_version_id: activeVersionId,
			rich_parameter_values: newBuildParameters,
		});
	};

	getWorkspaceResolveAutostart = async (
		workspaceId: string,
	): Promise<TypesGen.ResolveAutostartResponse> => {
		return this.request<TypesGen.ResolveAutostartResponse>(
			"GET",
			`/api/v2/workspaces/${workspaceId}/resolve-autostart`,
		);
	};

	issueReconnectingPTYSignedToken = async (
		params: TypesGen.IssueReconnectingPTYSignedTokenRequest,
	): Promise<TypesGen.IssueReconnectingPTYSignedTokenResponse> => {
		return this.request<TypesGen.IssueReconnectingPTYSignedTokenResponse>(
			"POST",
			"/api/v2/applications/reconnecting-pty-signed-token",
			{ body: params },
		);
	};

	getInsightsUserLatency = async (
		filters: InsightsParams,
	): Promise<TypesGen.UserLatencyInsightsResponse> => {
		return this.request<TypesGen.UserLatencyInsightsResponse>(
			"GET",
			"/api/v2/insights/user-latency",
			{ params: filters as RequestParams },
		);
	};

	getInsightsUserActivity = async (
		filters: InsightsParams,
	): Promise<TypesGen.UserActivityInsightsResponse> => {
		return this.request<TypesGen.UserActivityInsightsResponse>(
			"GET",
			"/api/v2/insights/user-activity",
			{ params: filters as RequestParams },
		);
	};

	getInsightsUserStatusCounts = async (
		offset = Math.trunc(new Date().getTimezoneOffset() / 60),
	): Promise<TypesGen.GetUserStatusCountsResponse> => {
		return this.request<TypesGen.GetUserStatusCountsResponse>(
			"GET",
			"/api/v2/insights/user-status-counts",
			{ params: { tz_offset: offset } },
		);
	};

	getInsightsTemplate = async (
		params: InsightsTemplateParams,
	): Promise<TypesGen.TemplateInsightsResponse> => {
		return this.request<TypesGen.TemplateInsightsResponse>("GET", "/api/v2/insights/templates", {
			params: params as RequestParams,
		});
	};

	getHealth = async (force = false) => {
		return this.request<TypesGen.HealthcheckReport>("GET", "/api/v2/debug/health", {
			params: { force: force.toString() },
		});
	};

	getHealthSettings = async (): Promise<TypesGen.HealthSettings> => {
		return this.request<TypesGen.HealthSettings>("GET", "/api/v2/debug/health/settings");
	};

	updateHealthSettings = async (data: TypesGen.UpdateHealthSettings) => {
		return this.request<TypesGen.HealthSettings>("PUT", "/api/v2/debug/health/settings", {
			body: data,
		});
	};

	putFavoriteWorkspace = async (workspaceID: string) => {
		await this.request("PUT", `/api/v2/workspaces/${workspaceID}/favorite`);
	};

	deleteFavoriteWorkspace = async (workspaceID: string) => {
		await this.request("DELETE", `/api/v2/workspaces/${workspaceID}/favorite`);
	};

	postWorkspaceUsage = async (workspaceID: string, options: PostWorkspaceUsageRequest) => {
		return this.request("POST", `/api/v2/workspaces/${workspaceID}/usage`, {
			body: options,
		});
	};

	getUserNotificationPreferences = async (userId: string) => {
		const res = await this.request<TypesGen.NotificationPreference[] | null>(
			"GET",
			`/api/v2/users/${userId}/notifications/preferences`,
		);
		return res ?? [];
	};

	putUserNotificationPreferences = async (
		userId: string,
		req: TypesGen.UpdateUserNotificationPreferences,
	) => {
		return this.request<TypesGen.NotificationPreference[]>(
			"PUT",
			`/api/v2/users/${userId}/notifications/preferences`,
			{ body: req },
		);
	};

	getSystemNotificationTemplates = async () => {
		return this.request<TypesGen.NotificationTemplate[]>(
			"GET",
			"/api/v2/notifications/templates/system",
		);
	};

	getCustomNotificationTemplates = async () => {
		return this.request<TypesGen.NotificationTemplate[]>(
			"GET",
			"/api/v2/notifications/templates/custom",
		);
	};

	getNotificationDispatchMethods = async () => {
		return this.request<TypesGen.NotificationMethodsResponse>(
			"GET",
			"/api/v2/notifications/dispatch-methods",
		);
	};

	updateNotificationTemplateMethod = async (
		templateId: string,
		req: TypesGen.UpdateNotificationTemplateMethod,
	) => {
		return this.request<void>("PUT", `/api/v2/notifications/templates/${templateId}/method`, {
			body: req,
		});
	};

	postTestNotification = async () => {
		await this.request("POST", "/api/v2/notifications/test");
	};

	createWebPushSubscription = async (userId: string, req: TypesGen.WebpushSubscription) => {
		await this.request("POST", `/api/v2/users/${userId}/webpush/subscription`, {
			body: req,
		});
	};

	deleteWebPushSubscription = async (userId: string, req: TypesGen.DeleteWebpushSubscription) => {
		await this.request("DELETE", `/api/v2/users/${userId}/webpush/subscription`, {
			body: req,
		});
	};

	requestOneTimePassword = async (req: TypesGen.RequestOneTimePasscodeRequest) => {
		await this.request("POST", "/api/v2/users/otp/request", { body: req });
	};

	changePasswordWithOTP = async (req: TypesGen.ChangePasswordWithOneTimePasscodeRequest) => {
		await this.request("POST", "/api/v2/users/otp/change-password", {
			body: req,
		});
	};

	workspaceBuildTimings = async (workspaceBuildId: string) => {
		return this.request<TypesGen.WorkspaceBuildTimings>(
			"GET",
			`/api/v2/workspacebuilds/${workspaceBuildId}/timings`,
		);
	};

	getOrganizationProvisionerJobs = async (orgId: string, params: GetProvisionerJobsParams = {}) => {
		return this.request<TypesGen.ProvisionerJob[]>(
			"GET",
			`/api/v2/organizations/${orgId}/provisionerjobs`,
			{ params: params as RequestParams },
		);
	};

	cancelOrganizationProvisionerJob = async (job: TypesGen.ProvisionerJob) => {
		switch (job.type) {
			case "workspace_build":
				if (!job.input.workspace_build_id) {
					throw new Error("Workspace build ID is required to cancel this job");
				}
				return this.cancelWorkspaceBuild(job.input.workspace_build_id);

			case "template_version_import":
				if (!job.input.template_version_id) {
					throw new Error("Template version ID is required to cancel this job");
				}
				return this.cancelTemplateVersionBuild(job.input.template_version_id);

			case "template_version_dry_run":
				if (!job.input.template_version_id) {
					throw new Error("Template version ID is required to cancel this job");
				}
				return this.cancelTemplateVersionDryRun(job.input.template_version_id, job.id);
		}
	};

	getAgentContainers = async (agentId: string, labels?: string[]) => {
		return this.request<TypesGen.WorkspaceAgentListContainersResponse>(
			"GET",
			`/api/v2/workspaceagents/${agentId}/containers`,
			{ params: labels ? { label: labels.join(",") } : undefined },
		);
	};

	getInboxNotifications = async (startingBeforeId?: string) => {
		return this.request<TypesGen.ListInboxNotificationsResponse>(
			"GET",
			"/api/v2/notifications/inbox",
			{
				params: startingBeforeId ? { starting_before: startingBeforeId } : undefined,
			},
		);
	};

	updateInboxNotificationReadStatus = async (
		notificationId: string,
		req: TypesGen.UpdateInboxNotificationReadStatusRequest,
	) => {
		return this.request<TypesGen.UpdateInboxNotificationReadStatusResponse>(
			"PUT",
			`/api/v2/notifications/inbox/${notificationId}/read-status`,
			{ body: req },
		);
	};

	markAllInboxNotificationsAsRead = async () => {
		await this.request("PUT", "/api/v2/notifications/inbox/mark-all-as-read");
	};

	createTask = async (user: string, req: TypesGen.CreateTaskRequest): Promise<TypesGen.Task> => {
		return this.request<TypesGen.Task>("POST", `/api/v2/tasks/${user}`, {
			body: req,
		});
	};

	getTasks = async (filter: TypesGen.TasksFilter): Promise<readonly TypesGen.Task[]> => {
		const query: string[] = [];
		if (filter.owner) {
			query.push(`owner:${filter.owner}`);
		}
		if (filter.status) {
			query.push(`status:${filter.status}`);
		}

		const res = await this.request<TypesGen.TasksListResponse>("GET", "/api/v2/tasks", {
			params: { q: query.join(", ") },
		});

		return res.tasks;
	};

	getTask = async (user: string, id: string): Promise<TypesGen.Task> => {
		return this.request<TypesGen.Task>("GET", `/api/v2/tasks/${user}/${id}`);
	};

	deleteTask = async (user: string, id: string): Promise<void> => {
		await this.request("DELETE", `/api/v2/tasks/${user}/${id}`);
	};

	updateTaskInput = async (user: string, id: string, input: string): Promise<void> => {
		await this.request("PATCH", `/api/v2/tasks/${user}/${id}/input`, {
			body: { input } satisfies TypesGen.UpdateTaskInputRequest,
		});
	};

	createTaskFeedback = async (_taskId: string, _req: CreateTaskFeedbackRequest) => {
		return new Promise<void>((res) => {
			setTimeout(() => res(), 500);
		});
	};
}

export type TaskFeedbackRating = "good" | "okay" | "bad";

export type CreateTaskFeedbackRequest = {
	rate: TaskFeedbackRating;
	comment?: string;
};

// Experimental API methods call endpoints under the /api/experimental/ prefix.
class ExperimentalApiMethods {
	constructor(protected readonly config: RequestConfig) {}

	protected async request<T>(
		method: string,
		url: string,
		options: {
			body?: unknown;
			params?: RequestParams;
			headers?: Record<string, string>;
			signal?: AbortSignal;
		} = {},
	): Promise<T> {
		const fullUrl = new URL(
			getURLWithSearchParams(
				url,
				options.params as Record<string, string | number | boolean | undefined | null>,
			),
			this.config.baseURL ||
				(typeof location !== "undefined" ? location.origin : "http://localhost"),
		);

		const headers = {
			...this.config.headers,
			...options.headers,
		};

		let body: BodyInit | undefined;
		if (options.body) {
			body = JSON.stringify(options.body);
			headers["Content-Type"] = "application/json";
		}

		const response = await fetch(fullUrl.toString(), {
			method,
			headers,
			body,
			signal: options.signal,
		});

		if (!response.ok) {
			let errorData: ApiErrorResponse;
			try {
				errorData = (await response.json()) as ApiErrorResponse;
			} catch {
				errorData = { message: response.statusText };
			}
			throw new CoderError(response, errorData);
		}

		return response.json();
	}

	getAIBridgeInterceptions = async (options: SearchParamOptions) => {
		return this.request<TypesGen.AIBridgeListInterceptionsResponse>(
			"GET",
			"/api/experimental/aibridge/interceptions",
			{ params: options as RequestParams },
		);
	};
}

// CSRF token metadata
const csrfToken =
	"KNKvagCBEHZK7ihe2t7fj6VeJ0UyTDco1yVUJE8N06oNqxLu5Zx1vRxZbgfC0mJJgeGkVjgs08mgPbcWPBkZ1A==";

const tokenMetadataElement =
	typeof document !== "undefined"
		? document.head.querySelector('meta[property="csrf-token"]')
		: null;

/**
 * Utility function to help create a WebSocket connection with Coder's API.
 */
function createWebSocket(path: string, params: URLSearchParams = new URLSearchParams()) {
	const protocol =
		typeof location !== "undefined" && location.protocol === "https:" ? "wss:" : "ws:";
	const host = typeof location !== "undefined" ? location.host : "localhost";
	const socket = new WebSocket(`${protocol}//${host}${path}?${params}`);
	socket.binaryType = "blob";
	return socket;
}

// Other non-API methods defined here to make it a little easier to find them.
interface ClientApi extends ApiMethods {
	getCsrfToken: () => string;
	setSessionToken: (token: string) => void;
	setHost: (host: string | undefined) => void;
	setProxyTarget: (target: string | undefined) => void;
}

const getNodeEnvValue = (key: string): string | undefined => {
	const processObject = typeof globalThis.process === "object" ? globalThis.process : undefined;
	return processObject?.env?.[key];
};

/** @public Exported for use by external consumers (e.g., VS Code extension). */
export class Api extends ApiMethods implements ClientApi {
	constructor() {
		const headers: Record<string, string> = {};

		const isDevelopment = getNodeEnvValue("NODE_ENV") === "development";

		const metadataIsAvailable =
			tokenMetadataElement !== null && tokenMetadataElement.getAttribute("content") !== null;

		if (isDevelopment) {
			headers["X-CSRF-TOKEN"] = csrfToken;
			if (tokenMetadataElement) {
				tokenMetadataElement.setAttribute("content", csrfToken);
			}
		} else if (metadataIsAvailable) {
			headers["X-CSRF-TOKEN"] = tokenMetadataElement?.getAttribute("content") ?? "";
		} else {
			// Do not write error logs if we are in a FE unit test or if there is no document (e.g., Electron)
			if (
				typeof document !== "undefined" &&
				!getNodeEnvValue("JEST_WORKER_ID") &&
				!getNodeEnvValue("VITEST")
			) {
				console.error("CSRF token not found");
			}
		}

		super({ headers });
	}

	getCsrfToken = (): string => {
		return csrfToken;
	};

	setSessionToken = (token: string): void => {
		this.config.headers = {
			...this.config.headers,
			"Coder-Session-Token": token,
		};
	};

	setHost = (host: string | undefined): void => {
		this.config.baseURL = host;
	};

	setProxyTarget = (target: string | undefined): void => {
		if (target) {
			this.config.headers = {
				...this.config.headers,
				"X-Proxy-Target": target,
			};
		} else {
			const { "X-Proxy-Target": _, ...rest } = this.config.headers || {};
			this.config.headers = rest;
		}
	};
}

export const API = new Api();
