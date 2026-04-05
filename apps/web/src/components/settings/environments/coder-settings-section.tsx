"use client";

import { SettingsCard, SettingsRow, SettingsSection } from "@/components/settings/settings-row";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import {
	CoderTemplateEditor,
	type CoderTemplateSelection,
} from "@/components/workspace/onboard/coder-template-editor";
import {
	useCoderProviderSettings,
	useUpdateCoderProviderSettings,
} from "@/hooks/settings/use-coder-provider";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export function CoderSettingsSection() {
	const { data, isLoading } = useCoderProviderSettings();
	const updateSettings = useUpdateCoderProviderSettings();
	const [selection, setSelection] = useState<CoderTemplateSelection>({
		templateId: null,
		presetId: null,
		parameters: [],
	});

	useEffect(() => {
		if (!data) {
			return;
		}
		setSelection({
			templateId: data.defaultTemplateId,
			presetId: data.defaultTemplateVersionPresetId,
			parameters: data.defaultParameters,
		});
	}, [data]);

	const isDirty = useMemo(() => {
		if (!data) {
			return false;
		}
		const current = JSON.stringify({
			templateId: data.defaultTemplateId,
			parameters: data.defaultParameters,
			presetId: data.defaultTemplateVersionPresetId ?? null,
		});
		const draft = JSON.stringify(selection);
		return current !== draft;
	}, [data, selection]);

	if (isLoading) {
		return (
			<SettingsSection title="Coder Settings">
				<LoadingDots size="sm" className="text-muted-foreground" />
			</SettingsSection>
		);
	}

	if (!data?.enabled) {
		return null;
	}

	return (
		<SettingsSection title="Coder Settings">
			<SettingsCard>
				<SettingsRow label="Host" description="The active Coder deployment for this organization.">
					<span className="max-w-80 truncate text-xs text-muted-foreground">
						{data.host ?? "Not configured"}
					</span>
				</SettingsRow>
				<SettingsRow
					label="Connection"
					description="Template catalog and variable metadata are fetched live from this deployment."
				>
					<span className="text-xs text-muted-foreground">
						{data.configured ? "Configured" : "Not configured"}
					</span>
				</SettingsRow>
			</SettingsCard>

			<div className="rounded-lg border border-border/80 bg-background p-4 space-y-4">
				{data.error ? <p className="text-sm text-muted-foreground">{data.error}</p> : null}

				<div key={`${data.defaultTemplateId ?? "none"}-${data.defaultParameters.length}`}>
					<CoderTemplateEditor
						initialSelection={{
							templateId: data.defaultTemplateId,
							presetId: data.defaultTemplateVersionPresetId,
							parameters: data.defaultParameters,
						}}
						onChange={setSelection}
					/>
				</div>

				<div className="flex justify-end">
					<Button
						onClick={async () => {
							try {
								await updateSettings.mutateAsync({
									defaultTemplateId: selection.templateId,
									defaultTemplateVersionPresetId: selection.presetId ?? null,
									defaultParameters: selection.parameters,
								});
								toast.success("Coder settings saved");
							} catch (error) {
								toast.error(
									error instanceof Error ? error.message : "Failed to save Coder settings",
								);
							}
						}}
						disabled={!data.configured || !isDirty || updateSettings.isPending}
					>
						Save Coder Settings
					</Button>
				</div>
			</div>
		</SettingsSection>
	);
}
