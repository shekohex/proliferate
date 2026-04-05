"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CSSProperties } from "react";

type TemplateParameter = {
	name: string;
	displayName: string | null;
	description: string;
	type: string;
	defaultValue: string;
	formType: string;
	required: boolean;
	sensitive: boolean;
	mutable: boolean;
	ephemeral: boolean;
	icon: string | null;
	options: Array<{
		name: string;
		description: string;
		value: string;
		icon: string | null;
	}>;
	validationRegex: string | null;
	validationMin: number | null;
	validationMax: number | null;
	validationMonotonic: string | null;
	validationError: string | null;
};

interface CoderTemplateParameterFieldProps {
	parameter: TemplateParameter;
	value: string;
	coderBaseUrl?: string | null;
	onChange: (value: string) => void;
}

function resolveCoderIconUrl(
	icon: string | null,
	coderBaseUrl: string | null | undefined,
): string | null {
	if (!icon) {
		return null;
	}

	if (icon.startsWith("http://") || icon.startsWith("https://")) {
		return icon;
	}

	if (!coderBaseUrl) {
		return icon;
	}

	try {
		return new URL(icon, coderBaseUrl).toString();
	} catch {
		return icon;
	}
}

function toLineSeparatedList(value: string): string {
	if (!value) {
		return "";
	}

	try {
		const parsed = JSON.parse(value) as unknown;
		if (!Array.isArray(parsed)) {
			return value;
		}
		return parsed.filter((entry): entry is string => typeof entry === "string").join("\n");
	} catch {
		return value;
	}
}

function toListJson(value: string): string {
	const entries = value
		.split("\n")
		.map((entry) => entry.trim())
		.filter(Boolean);
	return JSON.stringify(entries);
}

function getValidationHint(parameter: TemplateParameter): string | null {
	if (parameter.validationError) {
		return parameter.validationError;
	}

	if (parameter.type === "number") {
		if (parameter.validationMin !== null && parameter.validationMax !== null) {
			return `Allowed range: ${parameter.validationMin} to ${parameter.validationMax}`;
		}
		if (parameter.validationMin !== null) {
			return `Minimum: ${parameter.validationMin}`;
		}
		if (parameter.validationMax !== null) {
			return `Maximum: ${parameter.validationMax}`;
		}
	}

	if (parameter.validationRegex) {
		return `Must match: ${parameter.validationRegex}`;
	}

	return null;
}

function isSecretLikeParameter(parameter: TemplateParameter): boolean {
	if (parameter.sensitive) {
		return true;
	}

	const haystack =
		`${parameter.name} ${parameter.displayName ?? ""} ${parameter.description}`.toLowerCase();
	return ["password", "secret", "token", "api key", "apikey", "private key", "credential"].some(
		(fragment) => haystack.includes(fragment),
	);
}

function getSensitiveTextStyles(): CSSProperties {
	return { WebkitTextSecurity: "disc" } as unknown as CSSProperties;
}

export function CoderTemplateParameterField({
	parameter,
	value,
	coderBaseUrl,
	onChange,
}: CoderTemplateParameterFieldProps) {
	const displayName = parameter.displayName || parameter.name;
	const validationHint = getValidationHint(parameter);
	const parameterIconUrl = resolveCoderIconUrl(parameter.icon, coderBaseUrl);
	const isSecretLike = isSecretLikeParameter(parameter);

	return (
		<div className="space-y-1.5 border-b border-border/50 py-3 last:border-b-0">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<div className="flex items-center gap-2">
						{parameterIconUrl ? (
							<img src={parameterIconUrl} alt="" className="h-4 w-4 shrink-0 rounded-sm" />
						) : null}
						<Label htmlFor={`coder-template-parameter-${parameter.name}`}>{displayName}</Label>
						{!parameter.mutable ? <Badge variant="outline">Immutable</Badge> : null}
						{parameter.ephemeral ? <Badge variant="outline">Ephemeral</Badge> : null}
					</div>
					{parameter.description ? (
						<p className="text-xs text-muted-foreground">{parameter.description}</p>
					) : null}
				</div>
				<div className="text-[11px] text-muted-foreground">
					{parameter.required ? "Required" : "Optional"}
				</div>
			</div>

			{parameter.options.length > 0 ? (
				<Select value={value} onValueChange={onChange}>
					<SelectTrigger id={`coder-template-parameter-${parameter.name}`} className="h-8 w-full">
						<SelectValue placeholder={parameter.defaultValue || "Select a value"} />
					</SelectTrigger>
					<SelectContent>
						{parameter.options.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								<div className="flex items-center gap-2">
									{resolveCoderIconUrl(option.icon, coderBaseUrl) ? (
										<img
											src={resolveCoderIconUrl(option.icon, coderBaseUrl) ?? undefined}
											alt=""
											className="h-4 w-4 rounded-sm"
										/>
									) : null}
									<span>{option.name}</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			) : parameter.type === "bool" ? (
				<div className="flex items-center gap-2 py-1">
					<Checkbox
						id={`coder-template-parameter-${parameter.name}`}
						checked={(value || parameter.defaultValue || "false") === "true"}
						onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
					/>
					<Label
						htmlFor={`coder-template-parameter-${parameter.name}`}
						className="text-sm font-normal"
					>
						Enabled
					</Label>
				</div>
			) : parameter.type === "list(string)" ? (
				<Textarea
					id={`coder-template-parameter-${parameter.name}`}
					value={toLineSeparatedList(value)}
					onChange={(event) => onChange(toListJson(event.target.value))}
					placeholder={parameter.defaultValue || "One item per line"}
					className="min-h-24 text-sm"
					style={isSecretLike ? getSensitiveTextStyles() : undefined}
					autoComplete={isSecretLike ? "off" : undefined}
					spellCheck={!isSecretLike}
				/>
			) : parameter.formType === "textarea" ? (
				<Textarea
					id={`coder-template-parameter-${parameter.name}`}
					value={value}
					onChange={(event) => onChange(event.target.value)}
					placeholder={parameter.defaultValue || "Value"}
					className="min-h-24 text-sm"
					style={isSecretLike ? getSensitiveTextStyles() : undefined}
					autoComplete={isSecretLike ? "off" : undefined}
					spellCheck={!isSecretLike}
				/>
			) : (
				<Input
					id={`coder-template-parameter-${parameter.name}`}
					value={value}
					type={isSecretLike ? "password" : parameter.type === "number" ? "number" : "text"}
					onChange={(event) => onChange(event.target.value)}
					placeholder={parameter.defaultValue || "Value"}
					className="h-8 text-sm"
					min={parameter.validationMin ?? undefined}
					max={parameter.validationMax ?? undefined}
					autoComplete={isSecretLike ? "new-password" : undefined}
				/>
			)}

			{validationHint ? (
				<p className="text-[11px] text-muted-foreground">{validationHint}</p>
			) : null}
		</div>
	);
}
