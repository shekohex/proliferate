"use client";

import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import {
	CoderTemplateEditor,
	type CoderTemplateSelection,
} from "@/components/workspace/onboard/coder-template-editor";
import { useConfiguration, useUpdateConfiguration } from "@/hooks/sessions/use-configurations";
import { useCoderProviderSettings } from "@/hooks/settings/use-coder-provider";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface CoderTemplateSettingsSectionProps {
	configurationId: string;
}

export function CoderTemplateSettingsSection({
	configurationId,
}: CoderTemplateSettingsSectionProps) {
	const { data: coderSettings } = useCoderProviderSettings();
	const { data: configuration, isLoading } = useConfiguration(configurationId);
	const updateConfiguration = useUpdateConfiguration();
	const [selection, setSelection] = useState<CoderTemplateSelection>({
		templateId: null,
		presetId: null,
		parameters: [],
	});

	useEffect(() => {
		if (!configuration) {
			return;
		}
		setSelection({
			templateId: configuration.coderTemplateId ?? null,
			presetId: null,
			parameters: configuration.coderTemplateParameters ?? [],
		});
	}, [configuration]);

	const isDirty = useMemo(() => {
		if (!configuration) {
			return false;
		}
		return (
			JSON.stringify({
				templateId: configuration.coderTemplateId ?? null,
				presetId: null,
				parameters: configuration.coderTemplateParameters ?? [],
			}) !== JSON.stringify(selection)
		);
	}, [configuration, selection]);

	if (isLoading) {
		return (
			<section>
				<h2 className="text-sm font-medium mb-3">Coder Template</h2>
				<LoadingDots size="sm" className="text-muted-foreground" />
			</section>
		);
	}

	if (!coderSettings?.enabled) {
		return null;
	}

	if (!configuration) {
		return null;
	}

	return (
		<section>
			<div className="flex items-center justify-between mb-3">
				<h2 className="text-sm font-medium">Coder Template</h2>
				<Button
					size="sm"
					variant="outline"
					className="h-8"
					disabled={!isDirty || updateConfiguration.isPending}
					onClick={async () => {
						try {
							await updateConfiguration.mutateAsync(configurationId, {
								coderTemplateId: selection.templateId,
								coderTemplateParameters: selection.parameters,
							});
							toast.success("Coder template updated");
						} catch (error) {
							toast.error(
								error instanceof Error ? error.message : "Failed to update Coder template",
							);
						}
					}}
				>
					Save Template
				</Button>
			</div>
			<div className="rounded-lg border border-border/80 bg-background p-4">
				<CoderTemplateEditor
					initialSelection={{
						templateId: configuration.coderTemplateId ?? null,
						presetId: null,
						parameters: configuration.coderTemplateParameters ?? [],
					}}
					showPresetSelector={false}
					onChange={setSelection}
				/>
			</div>
		</section>
	);
}
