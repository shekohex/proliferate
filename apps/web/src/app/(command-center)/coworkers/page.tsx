"use client";

import { AutomationListRow } from "@/components/automations/automation-list-row";
import { TemplatePickerDialog } from "@/components/automations/template-picker-dialog";
import { WorkerListRow } from "@/components/automations/worker-list-row";
import {
	AutomationIllustration,
	PageEmptyState,
	PlusBadge,
} from "@/components/dashboard/page-empty-state";
import { PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COWORKER_LIST_TABS, type WorkerStatus } from "@/config/coworkers";
import { useCoworkerCreate, useCoworkerListFilters } from "@/hooks/automations/use-coworker-create";
import { cn } from "@/lib/utils";
import { BookTemplate, Plus, Search } from "lucide-react";

export default function CoworkersPage() {
	const {
		automations,
		workersList,
		templateCatalog,
		connectedProviders,
		hasWorkers,
		isLoading,
		totalItems,
		isPending,
		pickerOpen,
		setPickerOpen,
		createError,
		handleBlankCreate,
		handleTemplateSelect,
	} = useCoworkerCreate();

	const {
		activeTab,
		setActiveTab,
		searchQuery,
		setSearchQuery,
		counts,
		filteredWorkers,
		filteredAutomations,
	} = useCoworkerListFilters(workersList, automations, hasWorkers);

	return (
		<PageShell
			title="Coworkers"
			subtitle="Durable background agents that monitor sources and spawn task sessions."
			actions={
				<>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPickerOpen(true)}
						disabled={isPending}
					>
						<BookTemplate className="h-3.5 w-3.5 mr-1.5" />
						Templates
					</Button>
					<Button size="sm" onClick={handleBlankCreate} disabled={isPending}>
						<Plus className="h-4 w-4 mr-1.5" />
						New
					</Button>
				</>
			}
		>
			{isLoading ? (
				<div className="rounded-xl border border-border overflow-hidden">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-12 border-b border-border/50 last:border-0 animate-pulse bg-muted/30"
						/>
					))}
				</div>
			) : totalItems === 0 ? (
				<PageEmptyState
					illustration={<AutomationIllustration />}
					badge={<PlusBadge />}
					title="No coworkers created"
					description="Create a coworker to monitor sources and manage async engineering work."
				>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPickerOpen(true)}
						disabled={isPending}
					>
						<BookTemplate className="h-3.5 w-3.5 mr-1.5" />
						Browse templates
					</Button>
					<Button size="sm" onClick={handleBlankCreate} disabled={isPending}>
						<Plus className="h-4 w-4 mr-1.5" />
						New
					</Button>
				</PageEmptyState>
			) : (
				<>
					{/* Tabs + Search */}
					<div className="flex items-center justify-between gap-4 mb-4">
						<div className="flex items-center gap-1">
							{COWORKER_LIST_TABS.map((tab) => (
								<Button
									key={tab.value}
									variant="ghost"
									size="sm"
									onClick={() => setActiveTab(tab.value)}
									className={cn(
										"flex items-center gap-1.5 h-7 text-sm rounded-lg",
										activeTab === tab.value
											? "bg-card text-foreground font-medium shadow-subtle border border-border/50"
											: "text-muted-foreground",
									)}
								>
									{tab.label}
									<span
										className={cn(
											"text-xs tabular-nums px-1.5 rounded-full",
											activeTab === tab.value
												? "bg-muted text-muted-foreground"
												: "bg-muted/50 text-muted-foreground/70",
										)}
									>
										{counts[tab.value]}
									</span>
								</Button>
							))}
						</div>
						<div className="relative">
							<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
							<Input
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search"
								className="h-8 w-48 pl-8 text-sm bg-muted/50 border-0"
							/>
						</div>
					</div>

					{/* Workers table (V1) */}
					{hasWorkers ? (
						filteredWorkers.length === 0 ? (
							<div className="text-center py-12">
								<p className="text-sm text-muted-foreground">
									{searchQuery.trim()
										? "No coworkers match your search."
										: `No ${activeTab} coworkers.`}
								</p>
							</div>
						) : (
							<div className="rounded-xl border border-border overflow-hidden">
								<div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/30 text-xs text-muted-foreground">
									<div className="flex-1 min-w-0">Name</div>
									<div className="hidden sm:block w-20 shrink-0">Status</div>
									<div className="hidden md:block w-24 shrink-0">Last wake</div>
									<div className="hidden md:block w-16 shrink-0">Tasks</div>
									<div className="hidden lg:block w-20 shrink-0">Approvals</div>
									<div className="w-16 shrink-0 text-right">Updated</div>
								</div>
								{filteredWorkers.map((worker) => (
									<WorkerListRow
										key={worker.id}
										id={worker.id}
										name={worker.name}
										status={worker.status as WorkerStatus}
										objective={worker.objective}
										lastWakeAt={worker.lastWakeAt?.toISOString() ?? null}
										activeTaskCount={worker.activeTaskCount}
										pendingApprovalCount={worker.pendingApprovalCount}
										updatedAt={worker.updatedAt.toISOString()}
									/>
								))}
							</div>
						)
					) : /* Legacy automation list (fallback) */
					filteredAutomations.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-sm text-muted-foreground">
								{searchQuery.trim()
									? "No coworkers match your search."
									: `No ${activeTab} coworkers.`}
							</p>
						</div>
					) : (
						<div className="rounded-xl border border-border overflow-hidden">
							<div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/30 text-xs text-muted-foreground">
								<div className="flex-1 min-w-0">Name</div>
								<div className="hidden sm:block w-16 shrink-0">Scope</div>
								<div className="hidden md:block w-28 shrink-0">Triggers</div>
								<div className="hidden md:block w-24 shrink-0">Actions</div>
								<div className="hidden lg:block w-16 shrink-0 text-right">Created</div>
								<div className="w-16 shrink-0 text-right">Updated</div>
							</div>
							{filteredAutomations.map((automation) => (
								<AutomationListRow
									key={automation.id}
									id={automation.id}
									name={automation.name}
									enabled={automation.enabled}
									createdAt={automation.created_at}
									updatedAt={automation.updated_at}
									triggerCount={automation._count.triggers}
									scheduleCount={automation._count.schedules}
									activeProviders={automation.activeProviders}
									enabledTools={automation.enabled_tools}
								/>
							))}
						</div>
					)}
				</>
			)}

			<TemplatePickerDialog
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				templates={templateCatalog}
				connectedProviders={connectedProviders}
				onSelectTemplate={handleTemplateSelect}
				onSelectBlank={handleBlankCreate}
				isPending={isPending}
				error={createError}
			/>
		</PageShell>
	);
}
