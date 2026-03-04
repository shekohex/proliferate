import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ConnectorConfig } from "@proliferate/shared";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface ConnectorMenuProps {
	connector: ConnectorConfig;
	onEdit: () => void;
	onToggle: () => void;
	onDelete: () => void;
}

export function ConnectorMenu({ connector, onEdit, onToggle, onDelete }: ConnectorMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={onEdit} className="flex items-center gap-2">
					<Pencil className="h-3.5 w-3.5" />
					Edit
				</DropdownMenuItem>
				<DropdownMenuItem onClick={onToggle} className="flex items-center gap-2">
					{connector.enabled ? "Disable" : "Enable"}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={onDelete}
					className="flex items-center gap-2 text-destructive focus:text-destructive"
				>
					<Trash2 className="h-3.5 w-3.5" />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
