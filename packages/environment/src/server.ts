import { createEnv } from "@t3-oss/env-core";
import { nextPhase } from "./runtime";
import { createPublicSchema, createServerSchema } from "./schema";

const runtimeEnv = {
	DEPLOYMENT_PROFILE: process.env.DEPLOYMENT_PROFILE,
	DATABASE_URL: process.env.DATABASE_URL,
	BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
	ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
	API_PORT: process.env.API_PORT,
	AUTH_TOKEN: process.env.AUTH_TOKEN,
	AUTUMN_API_KEY: process.env.AUTUMN_API_KEY,
	AUTUMN_API_URL: process.env.AUTUMN_API_URL,
	BILLING_JWT_SECRET: process.env.BILLING_JWT_SECRET,
	ACTIONS_PLANE_LEGACY_TOKENS: process.env.ACTIONS_PLANE_LEGACY_TOKENS,
	CI: process.env.CI,
	CODER_SESSION_TOKEN: process.env.CODER_SESSION_TOKEN,
	CODER_URL: process.env.CODER_URL,
	COMPOSIO_API_KEY: process.env.COMPOSIO_API_KEY,
	COMPOSIO_BASE_URL: process.env.COMPOSIO_BASE_URL,
	CUSTOMERIO_SITE_ID: process.env.CUSTOMERIO_SITE_ID,
	CUSTOMERIO_API_KEY: process.env.CUSTOMERIO_API_KEY,
	CUSTOMERIO_REGION: process.env.CUSTOMERIO_REGION,
	DEFAULT_SANDBOX_PROVIDER: process.env.DEFAULT_SANDBOX_PROVIDER,
	DEV_CONSOLE_LOG_PATH: process.env.DEV_CONSOLE_LOG_PATH,
	DEV_USER_ID: process.env.DEV_USER_ID,
	E2B_API_KEY: process.env.E2B_API_KEY,
	E2B_DOMAIN: process.env.E2B_DOMAIN,
	E2B_TEMPLATE: process.env.E2B_TEMPLATE,
	E2B_TEMPLATE_ALIAS: process.env.E2B_TEMPLATE_ALIAS,
	EMAIL_FROM: process.env.EMAIL_FROM,
	GATEWAY_PORT: process.env.GATEWAY_PORT,
	GATEWAY_JWT_SECRET: process.env.GATEWAY_JWT_SECRET,
	GITHUB_APP_ID: process.env.GITHUB_APP_ID,
	GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY,
	GITHUB_APP_WEBHOOK_SECRET: process.env.GITHUB_APP_WEBHOOK_SECRET,
	GITHUB_OAUTH_APP_ID: process.env.GITHUB_OAUTH_APP_ID,
	GITHUB_OAUTH_APP_SECRET: process.env.GITHUB_OAUTH_APP_SECRET,
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
	INTERCOM_SECRET_KEY: process.env.INTERCOM_SECRET_KEY,
	LLM_PROXY_MASTER_KEY: process.env.LLM_PROXY_MASTER_KEY,
	LLM_PROXY_URL: process.env.LLM_PROXY_URL,
	LLM_PROXY_KEY_DURATION: process.env.LLM_PROXY_KEY_DURATION,
	LLM_PROXY_REQUIRED: process.env.LLM_PROXY_REQUIRED,
	LLM_PROXY_ADMIN_URL: process.env.LLM_PROXY_ADMIN_URL,
	LLM_PROXY_PUBLIC_URL: process.env.LLM_PROXY_PUBLIC_URL,
	LOG_LEVEL: process.env.LOG_LEVEL,
	LOG_PRETTY: process.env.LOG_PRETTY,
	NANGO_SECRET_KEY: process.env.NANGO_SECRET_KEY,
	SENTRY_OAUTH_CLIENT_ID: process.env.SENTRY_OAUTH_CLIENT_ID,
	SENTRY_OAUTH_CLIENT_SECRET: process.env.SENTRY_OAUTH_CLIENT_SECRET,
	LINEAR_OAUTH_CLIENT_ID: process.env.LINEAR_OAUTH_CLIENT_ID,
	LINEAR_OAUTH_CLIENT_SECRET: process.env.LINEAR_OAUTH_CLIENT_SECRET,
	JIRA_OAUTH_CLIENT_ID: process.env.JIRA_OAUTH_CLIENT_ID,
	JIRA_OAUTH_CLIENT_SECRET: process.env.JIRA_OAUTH_CLIENT_SECRET,
	NEXT_BUILD_STANDALONE: process.env.NEXT_BUILD_STANDALONE,
	OPENAI_API_KEY: process.env.OPENAI_API_KEY,
	GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
	DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
	XAI_API_KEY: process.env.XAI_API_KEY,
	MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
	WEB_PORT: process.env.WEB_PORT,
	WORKER_PORT: process.env.WORKER_PORT,
	PROLIFERATE_SLACK_BOT_TOKEN: process.env.PROLIFERATE_SLACK_BOT_TOKEN,
	PROLIFERATE_SLACK_CONNECT_EMAILS: process.env.PROLIFERATE_SLACK_CONNECT_EMAILS,
	REDIS_URL: process.env.REDIS_URL,
	EMAIL_ENABLED: process.env.EMAIL_ENABLED,
	RESEND_API_KEY: process.env.RESEND_API_KEY,
	TRIGGER_SERVICE_URL: process.env.TRIGGER_SERVICE_URL,
	S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
	S3_BUCKET: process.env.S3_BUCKET,
	S3_ENDPOINT_URL: process.env.S3_ENDPOINT_URL,
	S3_REGION: process.env.S3_REGION,
	S3_SECRET_KEY: process.env.S3_SECRET_KEY,
	SANDBOX_GIT_PULL_ON_RESTORE: process.env.SANDBOX_GIT_PULL_ON_RESTORE,
	SANDBOX_GIT_PULL_CADENCE_SECONDS: process.env.SANDBOX_GIT_PULL_CADENCE_SECONDS,
	SANDBOX_IMAGE_VERSION: process.env.SANDBOX_IMAGE_VERSION,
	IDLE_SNAPSHOT_DELAY_SECONDS: process.env.IDLE_SNAPSHOT_DELAY_SECONDS,
	SANDBOX_TIMEOUT_SECONDS: process.env.SANDBOX_TIMEOUT_SECONDS,
	SNAPSHOT_RETENTION_DAYS: process.env.SNAPSHOT_RETENTION_DAYS,
	SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
	SENTRY_ORG: process.env.SENTRY_ORG,
	SENTRY_PROJECT: process.env.SENTRY_PROJECT,
	SERVICE_TO_SERVICE_AUTH_TOKEN: process.env.SERVICE_TO_SERVICE_AUTH_TOKEN,
	SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
	SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
	SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
	STRICT_ENV: process.env.STRICT_ENV,
	ALLOWED_SIGNUP_EMAILS: process.env.ALLOWED_SIGNUP_EMAILS,
	SUPER_ADMIN_EMAILS: process.env.SUPER_ADMIN_EMAILS,
	TEST_REPO_ID: process.env.TEST_REPO_ID,
	TEST_TOKEN: process.env.TEST_TOKEN,
	USER_SECRETS_ENCRYPTION_KEY: process.env.USER_SECRETS_ENCRYPTION_KEY,
	WORKSPACE_DIR: process.env.WORKSPACE_DIR,
	NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
	NEXT_PUBLIC_GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL,
	NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
	NEXT_PUBLIC_BILLING_ENABLED: process.env.NEXT_PUBLIC_BILLING_ENABLED,
	NEXT_PUBLIC_ENFORCE_EMAIL_VERIFICATION: process.env.NEXT_PUBLIC_ENFORCE_EMAIL_VERIFICATION,
	NEXT_PUBLIC_INTEGRATIONS_ENABLED: process.env.NEXT_PUBLIC_INTEGRATIONS_ENABLED,
	NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
	NEXT_PUBLIC_GITHUB_APP_SLUG: process.env.NEXT_PUBLIC_GITHUB_APP_SLUG,
	NEXT_PUBLIC_INTERCOM_APP_ID: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
	NEXT_PUBLIC_NANGO_GITHUB_INTEGRATION_ID: process.env.NEXT_PUBLIC_NANGO_GITHUB_INTEGRATION_ID,
	NEXT_PUBLIC_NANGO_LINEAR_INTEGRATION_ID: process.env.NEXT_PUBLIC_NANGO_LINEAR_INTEGRATION_ID,
	NEXT_PUBLIC_NANGO_SENTRY_INTEGRATION_ID: process.env.NEXT_PUBLIC_NANGO_SENTRY_INTEGRATION_ID,
	NEXT_PUBLIC_NANGO_JIRA_INTEGRATION_ID: process.env.NEXT_PUBLIC_NANGO_JIRA_INTEGRATION_ID,
	NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
	NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
	NEXT_PUBLIC_USE_NANGO_GITHUB: process.env.NEXT_PUBLIC_USE_NANGO_GITHUB,
};

const rawEnv = createEnv({
	server: createServerSchema(runtimeEnv),
	client: createPublicSchema(runtimeEnv),
	runtimeEnv,
	clientPrefix: "NEXT_PUBLIC_",
	skipValidation:
		process.env.SKIP_ENV_VALIDATION === "true" ||
		(process.env.NODE_ENV !== "production" && process.env.STRICT_ENV !== "true"),
	onValidationError: (issues) => {
		const details = issues
			.map((issue) => `  ${issue.path?.join(".") || "unknown"}: ${issue.message}`)
			.join("\n");
		const message = `❌ Invalid environment variables:\n${details}`;
		console.error(message);
		throw new Error(message);
	},
});

// When env validation is skipped (default in local dev), @t3-oss/env-core returns the raw
// runtime env object (strings) instead of applying schema transforms/defaults. Normalize
// the handful of boolean/number fields we use as typed values at runtime.
const normalizeBoolean = (value: unknown, fallback = false) => {
	if (value === true || value === "true" || value === "1") return true;
	if (value === false || value === "false" || value === "0") return false;
	return fallback;
};

const normalizeInt = (value: unknown, fallback: number) => {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		if (Number.isFinite(parsed) && parsed > 0) return Math.trunc(parsed);
	}
	return fallback;
};

// During `next build`, env vars may be empty. Provide safe fallbacks so
// module-scope initialization (e.g. betterAuth()) doesn't crash the build.
const isBuild = nextPhase === "phase-production-build";

export const env = new Proxy(rawEnv as typeof rawEnv, {
	get(target, prop, receiver) {
		const value = Reflect.get(target, prop, receiver);

		// Build-phase fallbacks — return safe defaults when vars are missing during `next build`
		if (isBuild) {
			if (prop === "NEXT_PUBLIC_APP_URL" && !value) return "http://localhost:3000";
			if (prop === "BETTER_AUTH_SECRET" && !value) return "build-placeholder";
		}

		if (prop === "DEPLOYMENT_PROFILE") return value === "cloud" ? "cloud" : "self_host";
		if (prop === "SUPER_ADMIN_EMAILS") return typeof value === "string" ? value : "";

		if (prop === "API_PORT") return normalizeInt(value, 3001);
		if (prop === "GATEWAY_PORT") return normalizeInt(value, 8787);
		if (prop === "WEB_PORT") return normalizeInt(value, 3000);
		if (prop === "WORKER_PORT") return normalizeInt(value, 3002);
		if (prop === "IDLE_SNAPSHOT_DELAY_SECONDS") return normalizeInt(value, 300);
		if (prop === "SANDBOX_TIMEOUT_SECONDS") return normalizeInt(value, 3600);
		if (prop === "SNAPSHOT_RETENTION_DAYS") return normalizeInt(value, 14);

		if (prop === "ACTIONS_PLANE_LEGACY_TOKENS") return normalizeBoolean(value);
		if (prop === "CI") return normalizeBoolean(value);
		if (prop === "EMAIL_ENABLED") return normalizeBoolean(value);
		if (prop === "LLM_PROXY_REQUIRED") return normalizeBoolean(value);
		if (prop === "LOG_PRETTY") return normalizeBoolean(value);
		if (prop === "NEXT_BUILD_STANDALONE") return normalizeBoolean(value);
		if (prop === "STRICT_ENV") return normalizeBoolean(value);

		// Public booleans are used on the server too (workers, server components, etc.)
		if (prop === "NEXT_PUBLIC_BILLING_ENABLED") return normalizeBoolean(value);
		if (prop === "NEXT_PUBLIC_ENFORCE_EMAIL_VERIFICATION") return normalizeBoolean(value);
		if (prop === "NEXT_PUBLIC_INTEGRATIONS_ENABLED") return normalizeBoolean(value);
		if (prop === "NEXT_PUBLIC_USE_NANGO_GITHUB") return normalizeBoolean(value);

		return value;
	},
}) as typeof rawEnv;

/** Derived feature flags — read once from `env`, importable as constants. */
export const features = {
	get isBuild() {
		return isBuild;
	},
	get isDev() {
		return process.env.NODE_ENV === "development";
	},
	get isCloud() {
		return env.DEPLOYMENT_PROFILE === "cloud";
	},
	get isLocalDb() {
		return Boolean(
			env.DATABASE_URL?.includes("localhost") || env.DATABASE_URL?.includes("127.0.0.1"),
		);
	},
	get emailEnabled() {
		return env.EMAIL_ENABLED || env.NEXT_PUBLIC_ENFORCE_EMAIL_VERIFICATION;
	},
	get billingEnabled() {
		return env.NEXT_PUBLIC_BILLING_ENABLED;
	},
	get integrationsEnabled() {
		return env.NEXT_PUBLIC_INTEGRATIONS_ENABLED;
	},
} as const;
