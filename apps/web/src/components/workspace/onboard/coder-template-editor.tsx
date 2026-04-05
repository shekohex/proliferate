"use client";

import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Label } from "@/components/ui/label";
import { LoadingDots } from "@/components/ui/loading-dots";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCoderProviderSettings, useCoderTemplate } from "@/hooks/settings/use-coder-provider";
import { useEffect, useMemo, useRef, useState } from "react";
import { CoderTemplateParameterField } from "./coder-template-parameter-field";

export interface CoderTemplateSelection {
	templateId: string | null;
	presetId?: string | null;
	parameters: Array<{ name: string; value: string }>;
}

interface CoderTemplateEditorProps {
	initialSelection?: CoderTemplateSelection | null;
	showPresetSelector?: boolean;
	onChange: (selection: CoderTemplateSelection) => void;
}

function applyPresetParameters(
	parameters: Array<{ name: string; value: string }>,
	presetParameters: Array<{ name: string; value: string }>,
) {
	const presetMap = new Map(presetParameters.map((parameter) => [parameter.name, parameter.value]));
	return parameters.map((parameter) => ({
		name: parameter.name,
		value: presetMap.get(parameter.name) ?? parameter.value,
	}));
}

function mergeSavedParameters(
	parameters: Array<{ name: string; value: string }>,
	savedParameters: Array<{ name: string; value: string }>,
) {
	const savedMap = new Map(
		savedParameters
			.filter((parameter) => parameter.value !== null && parameter.value !== undefined)
			.map((parameter) => [parameter.name, parameter.value]),
	);

	return parameters.map((parameter) => ({
		name: parameter.name,
		value: savedMap.has(parameter.name)
			? (savedMap.get(parameter.name) ?? parameter.value)
			: parameter.value,
	}));
}

function buildInitialParameters(
	templateId: string,
	variables: Array<{
		name: string;
		defaultValue: string;
	}>,
	defaultTemplateId: string | null | undefined,
	defaultParameters: Array<{ name: string; value: string }>,
) {
	const defaultMap = new Map(
		defaultParameters.map((parameter) => [parameter.name, parameter.value]),
	);
	return variables.map((variable) => ({
		name: variable.name,
		value:
			templateId === defaultTemplateId
				? (defaultMap.get(variable.name) ?? variable.defaultValue ?? "")
				: (variable.defaultValue ?? ""),
	}));
}

export function CoderTemplateEditor({
	initialSelection,
	showPresetSelector = true,
	onChange,
}: CoderTemplateEditorProps) {
	const { data: settings, isLoading: settingsLoading } = useCoderProviderSettings();
	const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
	const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
		initialSelection?.presetId ?? null,
	);
	const [parameterOverrides, setParameterOverrides] = useState<
		Array<{ name: string; value: string }>
	>([]);
	const lastEmittedSelectionKey = useRef<string | null>(null);

	const templateOptions = settings?.templates ?? [];
	const { data: templateDetail, isLoading: templateLoading } = useCoderTemplate(
		selectedTemplateId,
		Boolean(settings?.enabled && settings?.configured && selectedTemplateId),
	);

	useEffect(() => {
		setSelectedTemplateId(initialSelection?.templateId ?? null);
		setSelectedPresetId(initialSelection?.presetId ?? null);
		setParameterOverrides([]);
	}, [initialSelection?.presetId, initialSelection?.templateId]);

	useEffect(() => {
		if (selectedTemplateId || initialSelection?.templateId) {
			return;
		}

		if (!settings?.enabled || !settings.configured || selectedTemplateId) {
			return;
		}

		const nextTemplateId = settings.defaultTemplateId ?? templateOptions[0]?.id ?? null;
		if (nextTemplateId) {
			setSelectedTemplateId(nextTemplateId);
		}
	}, [initialSelection?.templateId, selectedTemplateId, settings, templateOptions]);

	const resolvedParameters = useMemo(() => {
		if (!templateDetail) {
			return [] as Array<{ name: string; value: string }>;
		}

		const defaults = buildInitialParameters(
			templateDetail.id,
			templateDetail.variables,
			settings?.defaultTemplateId,
			settings?.defaultParameters ?? [],
		);
		const selectedPreset =
			templateDetail.presets.find((preset) => preset.id === selectedPresetId) ?? null;
		const withPreset = selectedPreset
			? applyPresetParameters(defaults, selectedPreset.parameters)
			: defaults;
		const withSavedValues =
			initialSelection?.templateId === templateDetail.id
				? mergeSavedParameters(withPreset, initialSelection.parameters)
				: withPreset;

		return mergeSavedParameters(withSavedValues, parameterOverrides);
	}, [
		initialSelection?.parameters,
		initialSelection?.templateId,
		parameterOverrides,
		selectedPresetId,
		settings?.defaultParameters,
		settings?.defaultTemplateId,
		templateDetail,
	]);

	const filteredParameters = useMemo(
		() => resolvedParameters.filter((parameter) => parameter.value.trim().length > 0),
		[resolvedParameters],
	);
	const emittedSelectionKey = useMemo(
		() =>
			JSON.stringify({
				templateId: selectedTemplateId,
				presetId: selectedPresetId,
				parameters: filteredParameters,
			}),
		[filteredParameters, selectedPresetId, selectedTemplateId],
	);

	useEffect(() => {
		if (lastEmittedSelectionKey.current === emittedSelectionKey) {
			return;
		}

		lastEmittedSelectionKey.current = emittedSelectionKey;
		onChange({
			templateId: selectedTemplateId,
			presetId: selectedPresetId,
			parameters: filteredParameters,
		});
	}, [emittedSelectionKey, filteredParameters, onChange, selectedPresetId, selectedTemplateId]);

	if (settingsLoading) {
		return (
			<div>
				<h3 className="text-sm font-medium mb-2">Coder Template</h3>
				<LoadingDots size="sm" className="text-muted-foreground" />
			</div>
		);
	}

	if (!settings?.enabled) {
		return null;
	}

	return (
		<div>
			<h3 className="text-sm font-medium mb-2">Coder Template</h3>
			<p className="text-xs text-muted-foreground mb-3">
				Choose the workspace template for this repository. The selected template and values are
				saved with the environment configuration.
			</p>

			{!settings.configured ? (
				<div className="rounded-lg border border-border/80 bg-background p-3 text-sm text-muted-foreground">
					{settings.error ?? "Coder is not configured yet."}
				</div>
			) : (
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="coder-template-select">Template</Label>
						<Select
							value={selectedTemplateId ?? "__none"}
							onValueChange={(value) => {
								if (value === "__none") {
									setSelectedTemplateId(null);
									setSelectedPresetId(null);
									setParameterOverrides([]);
									return;
								}
								setSelectedTemplateId(value);
								setSelectedPresetId(null);
								setParameterOverrides([]);
							}}
						>
							<SelectTrigger id="coder-template-select" className="h-9 w-full">
								<SelectValue placeholder="Select a template" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none">No default template</SelectItem>
								{templateOptions.map((template) => (
									<SelectItem key={template.id} value={template.id}>
										{template.displayName || template.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{templateDetail?.description ? (
							<p className="text-xs text-muted-foreground">{templateDetail.description}</p>
						) : null}
					</div>

					{showPresetSelector && templateDetail?.presets.length ? (
						<div className="space-y-2">
							<Label htmlFor="coder-template-preset-select">Preset</Label>
							<Select
								value={selectedPresetId ?? "__none"}
								onValueChange={(value) => {
									setSelectedPresetId(value === "__none" ? null : value);
									setParameterOverrides([]);
								}}
							>
								<SelectTrigger id="coder-template-preset-select" className="h-9 w-full">
									<SelectValue placeholder="Select a preset" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none">No preset</SelectItem>
									{templateDetail.presets.map((preset) => (
										<SelectItem key={preset.id} value={preset.id}>
											{preset.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					) : null}

					{templateLoading ? (
						<LoadingDots size="sm" className="text-muted-foreground" />
					) : templateDetail?.variables.length ? (
						<CollapsibleSection
							title="Options"
							defaultOpen={false}
							className="rounded-lg border border-border/80 bg-muted/20"
						>
							<div className="max-h-72 overflow-y-auto px-4 pb-2">
								{templateDetail.variables.map((variable, index) => (
									<CoderTemplateParameterField
										key={variable.name}
										parameter={variable}
										value={resolvedParameters[index]?.value ?? ""}
										coderBaseUrl={settings.host}
										onChange={(nextValue) => {
											setParameterOverrides((current) => {
												const next = [...current];
												const existingIndex = next.findIndex(
													(parameter) => parameter.name === variable.name,
												);
												if (existingIndex === -1) {
													next.push({ name: variable.name, value: nextValue });
												} else {
													next[existingIndex] = { ...next[existingIndex], value: nextValue };
												}
												return next;
											});
										}}
									/>
								))}
							</div>
						</CollapsibleSection>
					) : selectedTemplateId ? (
						<p className="text-xs text-muted-foreground">
							This template does not expose configurable variables.
						</p>
					) : null}
				</div>
			)}
		</div>
	);
}
