"use client";

import { useActiveBaselinesByRepos } from "@/hooks/use-baselines";
import { useRepos } from "@/hooks/use-repos";
import { useMemo } from "react";

export interface BaselineInfo {
	id: string;
	repoId: string;
	status: string;
	version: string | null;
}

export function useReposList(filterQuery: string) {
	const { data: repos, isLoading } = useRepos();

	const repoIds = useMemo(() => (repos ?? []).map((r) => r.id), [repos]);
	const { data: activeBaselines } = useActiveBaselinesByRepos(repoIds, repoIds.length > 0);

	const baselinesByRepo = useMemo(() => {
		const list = activeBaselines ?? [];
		const map = new Map<string, BaselineInfo>();
		for (const b of list) {
			map.set(b.repoId, b);
		}
		return map;
	}, [activeBaselines]);

	const filteredRepos = useMemo(() => {
		const list = repos ?? [];
		if (!filterQuery) return list;
		const q = filterQuery.toLowerCase();
		return list.filter((r) => r.githubRepoName.toLowerCase().includes(q));
	}, [repos, filterQuery]);

	return {
		repos,
		filteredRepos,
		baselinesByRepo,
		isLoading,
	};
}
