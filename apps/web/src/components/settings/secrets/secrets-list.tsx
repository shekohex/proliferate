"use client";

import { SettingsCard, SettingsRow } from "@/components/settings/settings-row";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import { Plus, Trash2 } from "lucide-react";

interface SecretItem {
	id: string;
	key: string;
	description: string | null;
}

export function SecretsList({
	secrets,
	deletingId,
	onDelete,
	onAdd,
}: {
	secrets: SecretItem[];
	deletingId: string | null;
	onDelete: (id: string) => void;
	onAdd: () => void;
}) {
	return (
		<SettingsCard>
			{secrets.map((secret) => (
				<SettingsRow
					key={secret.id}
					label={secret.key}
					description={secret.description || undefined}
				>
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6 text-muted-foreground hover:text-destructive"
						onClick={() => onDelete(secret.id)}
						disabled={deletingId === secret.id}
					>
						{deletingId === secret.id ? (
							<LoadingDots size="sm" />
						) : (
							<Trash2 className="h-3 w-3" />
						)}
					</Button>
				</SettingsRow>
			))}
			<li className="px-4 py-3">
				<Button
					variant="ghost"
					size="sm"
					className="w-full justify-start text-muted-foreground hover:text-foreground h-8"
					onClick={onAdd}
				>
					<Plus className="h-4 w-4 mr-2" />
					Add Secret
				</Button>
			</li>
		</SettingsCard>
	);
}
