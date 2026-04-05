import { type ApiError, type ApiErrorResponse, CoderError } from "../src/errors";
import type * as TypesGen from "../src/typesGenerated";

export const MockOrganization: TypesGen.Organization = {
	id: "my-organization-id",
	name: "my-organization",
	display_name: "My Organization",
	description: "An organization that gets used for stuff.",
	icon: "/emojis/1f957.png",
	created_at: "",
	updated_at: "",
	is_default: false,
};

export const MockDefaultOrganization: TypesGen.Organization = {
	...MockOrganization,
	is_default: true,
};

export const MockSessionToken: TypesGen.LoginWithPasswordResponse = {
	session_token: "my-session-token",
};

export const MockAPIKey: TypesGen.GenerateAPIKeyResponse = {
	key: "my-api-key",
};

export const MockBuildInfo: TypesGen.BuildInfoResponse = {
	agent_api_version: "1.0",
	provisioner_api_version: "1.1",
	external_url: "file:///mock-url",
	version: "v2.99.99",
	dashboard_url: "https:///mock-url",
	workspace_proxy: false,
	upgrade_message: "My custom upgrade message",
	deployment_id: "510d407f-e521-4180-b559-eab4a6d802b8",
	webpush_public_key: "fake-public-key",
	telemetry: true,
};

export const MockUserOwner: TypesGen.User = {
	id: "test-user",
	username: "TestUser",
	email: "test@coder.com",
	created_at: "",
	updated_at: "",
	status: "active",
	organization_ids: [MockOrganization.id],
	roles: [],
	avatar_url: "https://avatars.githubusercontent.com/u/95932066?s=200&v=4",
	last_seen_at: "",
	login_type: "password",
	name: "",
};

export const MockUserMember: TypesGen.User = {
	id: "test-user-2",
	username: "TestUser2",
	email: "test2@coder.com",
	created_at: "",
	updated_at: "",
	status: "active",
	organization_ids: [MockOrganization.id],
	roles: [],
	avatar_url: "",
	last_seen_at: "2022-09-14T19:12:21Z",
	login_type: "oidc",
	name: "Mock User The Second",
};

export const MockProvisionerJob: TypesGen.ProvisionerJob = {
	created_at: "",
	id: "test-provisioner-job",
	status: "succeeded",
	file_id: MockOrganization.id,
	completed_at: "2022-05-17T17:39:01.382927298Z",
	initiator_id: MockUserMember.id,
	tags: {
		scope: "organization",
	},
	queue_position: 0,
	queue_size: 0,
	input: {
		template_version_id: "test-template-version",
	},
	organization_id: MockOrganization.id,
	type: "template_version_dry_run",
	metadata: {
		workspace_id: "test-workspace",
		template_display_name: "Test Template",
		template_icon: "/icon/code.svg",
		template_id: "test-template",
		template_name: "test-template",
		template_version_name: "test-version",
		workspace_name: "test-workspace",
	},
	logs_overflowed: false,
};

export const MockFailedProvisionerJob: TypesGen.ProvisionerJob = {
	...MockProvisionerJob,
	status: "failed",
};

export const MockTemplateVersion: TypesGen.TemplateVersion = {
	id: "test-template-version",
	created_at: "2022-05-17T17:39:01.382927298Z",
	updated_at: "2022-05-17T17:39:01.382927298Z",
	template_id: "test-template",
	job: MockProvisionerJob,
	name: "test-version",
	message: "first version",
	readme: "readme",
	created_by: MockUserOwner,
	archived: false,
	has_external_agent: false,
};

export const MockTemplateVersion2: TypesGen.TemplateVersion = {
	...MockTemplateVersion,
	id: "test-template-version-2",
	name: "test-version-2",
};

export const MockTemplate: TypesGen.Template = {
	id: "test-template",
	created_at: "2022-05-17T17:39:01.382927298Z",
	updated_at: "2022-05-18T17:39:01.382927298Z",
	organization_id: MockOrganization.id,
	organization_name: MockOrganization.name,
	organization_display_name: MockOrganization.display_name,
	organization_icon: "/emojis/1f5fa.png",
	name: "test-template",
	display_name: "Test Template",
	provisioner: "echo",
	active_version_id: MockTemplateVersion.id,
	active_user_count: 1,
	build_time_stats: {
		start: { P50: 1000, P95: 1500 },
		stop: { P50: 1000, P95: 1500 },
		delete: { P50: 1000, P95: 1500 },
	},
	description: "This is a test description.",
	default_ttl_ms: 24 * 60 * 60 * 1000,
	activity_bump_ms: 1 * 60 * 60 * 1000,
	autostop_requirement: {
		days_of_week: ["sunday"],
		weeks: 1,
	},
	autostart_requirement: {
		days_of_week: ["monday"],
	},
	created_by_id: "test-creator-id",
	created_by_name: "test_creator",
	icon: "/icon/code.svg",
	allow_user_cancel_workspace_jobs: true,
	failure_ttl_ms: 0,
	time_til_dormant_ms: 0,
	time_til_dormant_autodelete_ms: 0,
	allow_user_autostart: true,
	allow_user_autostop: true,
	require_active_version: false,
	deprecated: false,
	deprecation_message: "",
	max_port_share_level: "public",
	use_classic_parameter_flow: false,
	cors_behavior: "simple",
	use_terraform_workspace_cache: false,
};

export const MockWorkspaceAgent: TypesGen.WorkspaceAgent = {
	apps: [],
	architecture: "amd64",
	created_at: "",
	environment_variables: {},
	id: "test-workspace-agent",
	parent_id: null,
	name: "a-workspace-agent",
	operating_system: "linux",
	resource_id: "",
	status: "connected",
	updated_at: "",
	version: MockBuildInfo.version,
	api_version: MockBuildInfo.agent_api_version,
	latency: {},
	connection_timeout_seconds: 120,
	troubleshooting_url: "https://coder.com/troubleshoot",
	lifecycle_state: "starting",
	logs_length: 0,
	logs_overflowed: false,
	log_sources: [],
	scripts: [],
	startup_script_behavior: "non-blocking",
	subsystems: [],
	health: { healthy: true },
	display_apps: [],
};

export const MockWorkspaceResource: TypesGen.WorkspaceResource = {
	id: "test-workspace-resource",
	name: "a-workspace-resource",
	agents: [MockWorkspaceAgent],
	created_at: "",
	job_id: "",
	type: "google_compute_disk",
	workspace_transition: "start",
	hide: false,
	icon: "",
	metadata: [],
	daily_cost: 10,
};

export const MockWorkspaceBuild: TypesGen.WorkspaceBuild = {
	build_number: 1,
	created_at: "2022-05-17T17:39:01.382927298Z",
	id: "1",
	initiator_id: MockUserOwner.id,
	initiator_name: MockUserOwner.username,
	job: MockProvisionerJob,
	template_version_id: MockTemplateVersion.id,
	template_version_name: MockTemplateVersion.name,
	transition: "start",
	updated_at: "2022-05-17T17:39:01.382927298Z",
	workspace_name: "test-workspace",
	workspace_owner_id: MockUserOwner.id,
	workspace_owner_name: MockUserOwner.username,
	workspace_owner_avatar_url: MockUserOwner.avatar_url,
	workspace_id: "759f1d46-3174-453d-aa60-980a9c1442f3",
	deadline: "2022-05-17T23:39:00.00Z",
	reason: "initiator",
	resources: [MockWorkspaceResource],
	status: "running",
	daily_cost: 20,
	matched_provisioners: {
		count: 1,
		available: 1,
	},
	template_version_preset_id: null,
};

export const MockWorkspaceBuildStop: TypesGen.WorkspaceBuild = {
	...MockWorkspaceBuild,
	id: "2",
	transition: "stop",
};

export const MockWorkspace: TypesGen.Workspace = {
	id: "test-workspace",
	name: "Test-Workspace",
	created_at: "",
	updated_at: "",
	template_id: MockTemplate.id,
	template_name: MockTemplate.name,
	template_icon: MockTemplate.icon,
	template_display_name: MockTemplate.display_name,
	template_allow_user_cancel_workspace_jobs: MockTemplate.allow_user_cancel_workspace_jobs,
	template_active_version_id: MockTemplate.active_version_id,
	template_require_active_version: MockTemplate.require_active_version,
	template_use_classic_parameter_flow: true,
	outdated: false,
	owner_id: MockUserOwner.id,
	organization_id: MockOrganization.id,
	organization_name: "default",
	owner_name: MockUserOwner.username,
	owner_avatar_url: "https://avatars.githubusercontent.com/u/7122116?v=4",
	autostart_schedule: "",
	ttl_ms: 2 * 60 * 60 * 1000,
	latest_build: MockWorkspaceBuild,
	last_used_at: "2022-05-16T15:29:10.302441433Z",
	health: {
		healthy: true,
		failing_agents: [],
	},
	latest_app_status: null,
	automatic_updates: "never",
	allow_renames: true,
	favorite: false,
	deleting_at: null,
	dormant_at: null,
	next_start_at: null,
	is_prebuild: false,
	shared_with: [],
};

export const MockStoppedWorkspace: TypesGen.Workspace = {
	...MockWorkspace,
	id: "test-stopped-workspace",
	latest_build: { ...MockWorkspaceBuildStop, status: "stopped" },
};

export const MockTemplateVersionParameter1: TypesGen.TemplateVersionParameter = {
	name: "first_parameter",
	type: "string",
	form_type: "input",
	description: "This is first parameter",
	description_plaintext: "Markdown: This is first parameter",
	default_value: "abc",
	mutable: true,
	icon: "/icon/folder.svg",
	options: [],
	required: true,
	ephemeral: false,
};

export const MockTemplateVersionParameter2: TypesGen.TemplateVersionParameter = {
	name: "second_parameter",
	type: "number",
	form_type: "input",
	description: "This is second parameter",
	description_plaintext: "Markdown: This is second parameter",
	default_value: "2",
	mutable: true,
	icon: "/icon/folder.svg",
	options: [],
	validation_min: 1,
	validation_max: 3,
	validation_monotonic: "increasing",
	required: true,
	ephemeral: false,
};

export const MockWorkspaceBuildParameter1: TypesGen.WorkspaceBuildParameter = {
	name: "first_parameter",
	value: "abc",
};

export const mockApiError = (data: ApiErrorResponse): ApiError => {
	return new CoderError(
		new Response(JSON.stringify(data), {
			status: 400,
			statusText: "Bad Request",
		}),
		data,
	);
};

export const MockWorkspacesResponse: TypesGen.WorkspacesResponse = {
	workspaces: Array.from({ length: 26 }, (_, i) => i + 1).map((id: number) => ({
		...MockWorkspace,
		id: id.toString(),
		name: `${MockWorkspace.name}${id}`,
	})),
	count: 26,
};
