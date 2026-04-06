import { z } from "zod";

export const DEFAULT_CODER_PROLIFERATE_RELEASE_REF = "coder-module-v0.1.0";

export const MANAGED_CODER_TEMPLATE_PARAMETER_NAMES = [
	"enable_proliferate",
	"proliferate_release_ref",
	"proliferate_gateway_url",
	"proliferate_session_id",
	"proliferate_session_token",
] as const;

const MANAGED_CODER_TEMPLATE_PARAMETER_NAME_SET = new Set<string>(
	MANAGED_CODER_TEMPLATE_PARAMETER_NAMES,
);

export function isManagedCoderTemplateParameterName(name: string): boolean {
	return MANAGED_CODER_TEMPLATE_PARAMETER_NAME_SET.has(name);
}

export const CoderTemplateParameterValueSchema = z.object({
	name: z.string(),
	value: z.string(),
});

export type CoderTemplateParameterValue = z.infer<typeof CoderTemplateParameterValueSchema>;

export const CoderTemplateVariableSchema = z.object({
	name: z.string(),
	displayName: z.string().nullable(),
	description: z.string(),
	type: z.string(),
	defaultValue: z.string(),
	formType: z.string(),
	required: z.boolean(),
	sensitive: z.boolean(),
	mutable: z.boolean(),
	ephemeral: z.boolean(),
	icon: z.string().nullable(),
	options: z.array(
		z.object({
			name: z.string(),
			description: z.string(),
			value: z.string(),
			icon: z.string().nullable(),
		}),
	),
	validationRegex: z.string().nullable(),
	validationMin: z.number().nullable(),
	validationMax: z.number().nullable(),
	validationMonotonic: z.string().nullable(),
	validationError: z.string().nullable(),
});

export type CoderTemplateVariable = z.infer<typeof CoderTemplateVariableSchema>;

export const CoderTemplateSummarySchema = z.object({
	id: z.string(),
	name: z.string(),
	displayName: z.string(),
	description: z.string(),
	activeVersionId: z.string(),
	deprecated: z.boolean(),
});

export type CoderTemplateSummary = z.infer<typeof CoderTemplateSummarySchema>;

export const CoderTemplatePresetSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	icon: z.string().nullable(),
	isDefault: z.boolean(),
	parameters: z.array(CoderTemplateParameterValueSchema),
});

export type CoderTemplatePreset = z.infer<typeof CoderTemplatePresetSchema>;

export const CoderTemplateDetailSchema = CoderTemplateSummarySchema.extend({
	variables: z.array(CoderTemplateVariableSchema),
	presets: z.array(CoderTemplatePresetSchema),
});

export type CoderTemplateDetail = z.infer<typeof CoderTemplateDetailSchema>;

export const CoderProviderSettingsSchema = z.object({
	enabled: z.boolean(),
	configured: z.boolean(),
	host: z.string().nullable(),
	defaultTemplateId: z.string().nullable(),
	defaultTemplateVersionPresetId: z.string().nullable(),
	defaultParameters: z.array(CoderTemplateParameterValueSchema),
	templates: z.array(CoderTemplateSummarySchema),
	error: z.string().nullable(),
});

export type CoderProviderSettings = z.infer<typeof CoderProviderSettingsSchema>;

export const UpdateCoderProviderSettingsInputSchema = z.object({
	defaultTemplateId: z.string().nullable(),
	defaultTemplateVersionPresetId: z.string().nullable(),
	defaultParameters: z.array(CoderTemplateParameterValueSchema),
});

export type UpdateCoderProviderSettingsInput = z.infer<
	typeof UpdateCoderProviderSettingsInputSchema
>;
