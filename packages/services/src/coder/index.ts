import type {
	CoderProviderSettings,
	CoderTemplateDetail,
	UpdateCoderProviderSettingsInput,
} from "@proliferate/shared/contracts/coder-provider";
import {
	getCoderProviderDefaults,
	getCoderTemplate,
	listCoderTemplates,
} from "@proliferate/shared/providers";
import * as orgsDb from "../orgs/db";
import * as coderDb from "./db";

export class CoderSettingsPermissionError extends Error {
	constructor(message = "Only admins and owners can manage Coder settings") {
		super(message);
		this.name = "CoderSettingsPermissionError";
	}
}

export async function getStoredCoderProviderSettings(orgId: string) {
	return coderDb.getStoredCoderSettings(orgId);
}

export async function getCoderProviderSettings(orgId: string): Promise<CoderProviderSettings> {
	const defaults = getCoderProviderDefaults();
	const stored = await coderDb.getStoredCoderSettings(orgId);
	if (!defaults.enabled || !defaults.configured) {
		return {
			...defaults,
			defaultTemplateId: stored.defaultTemplateId,
			defaultTemplateVersionPresetId: stored.defaultTemplateVersionPresetId,
			defaultParameters: stored.defaultParameters,
			templates: [],
		};
	}

	try {
		const templates = await listCoderTemplates();
		return {
			...defaults,
			defaultTemplateId: stored.defaultTemplateId,
			defaultTemplateVersionPresetId: stored.defaultTemplateVersionPresetId,
			defaultParameters: stored.defaultParameters,
			templates,
		};
	} catch (error) {
		return {
			...defaults,
			configured: false,
			defaultTemplateId: stored.defaultTemplateId,
			defaultTemplateVersionPresetId: stored.defaultTemplateVersionPresetId,
			defaultParameters: stored.defaultParameters,
			templates: [],
			error: error instanceof Error ? error.message : "Failed to load Coder templates.",
		};
	}
}

export async function getCoderTemplateDetail(templateId: string): Promise<CoderTemplateDetail> {
	return getCoderTemplate(templateId);
}

export async function updateCoderProviderSettings(input: {
	orgId: string;
	userId: string;
	settings: UpdateCoderProviderSettingsInput;
}): Promise<CoderProviderSettings> {
	const role = await orgsDb.getUserRole(input.userId, input.orgId);
	if (role !== "owner" && role !== "admin") {
		throw new CoderSettingsPermissionError();
	}

	if (!input.settings.defaultTemplateId) {
		await coderDb.updateStoredCoderSettings(input.orgId, {
			defaultTemplateId: null,
			defaultTemplateVersionPresetId: null,
			defaultParameters: [],
		});
		return getCoderProviderSettings(input.orgId);
	}

	const template = await getCoderTemplate(input.settings.defaultTemplateId);
	const knownParameters = new Set(template.variables.map((variable) => variable.name));
	for (const parameter of input.settings.defaultParameters) {
		if (!knownParameters.has(parameter.name)) {
			throw new Error(`Unknown Coder template parameter '${parameter.name}'`);
		}
	}

	await coderDb.updateStoredCoderSettings(input.orgId, {
		defaultTemplateId: input.settings.defaultTemplateId,
		defaultTemplateVersionPresetId: input.settings.defaultTemplateVersionPresetId,
		defaultParameters: input.settings.defaultParameters,
	});

	return getCoderProviderSettings(input.orgId);
}
