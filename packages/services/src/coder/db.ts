import { eq, getDb, organization } from "../db/client";

export interface StoredCoderSettingsRow {
	defaultTemplateId: string | null;
	defaultTemplateVersionPresetId: string | null;
	defaultParameters: Array<{ name: string; value: string }>;
}

type RawCoderSettings = {
	defaultTemplateId?: string | null;
	defaultTemplateVersionPresetId?: string | null;
	defaultParameters?: Array<{ name: string; value: string }>;
};

function parseStoredCoderSettings(raw: unknown): StoredCoderSettingsRow {
	if (!raw || typeof raw !== "object") {
		return {
			defaultTemplateId: null,
			defaultTemplateVersionPresetId: null,
			defaultParameters: [],
		};
	}

	const settings = raw as RawCoderSettings;
	return {
		defaultTemplateId: settings.defaultTemplateId ?? null,
		defaultTemplateVersionPresetId: settings.defaultTemplateVersionPresetId ?? null,
		defaultParameters: settings.defaultParameters ?? [],
	};
}

export async function getStoredCoderSettings(orgId: string): Promise<StoredCoderSettingsRow> {
	const db = getDb();
	const result = await db.query.organization.findFirst({
		where: eq(organization.id, orgId),
		columns: {
			coderSettings: true,
		},
	});

	return parseStoredCoderSettings(result?.coderSettings);
}

export async function updateStoredCoderSettings(
	orgId: string,
	settings: StoredCoderSettingsRow,
): Promise<void> {
	const db = getDb();
	await db.update(organization).set({ coderSettings: settings }).where(eq(organization.id, orgId));
}
