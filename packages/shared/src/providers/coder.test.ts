import { describe, expect, it } from "vitest";
import { CoderProvider } from "./coder";
import { E2BProvider, getSandboxProvider } from "./index";

describe("getSandboxProvider", () => {
	it("returns the coder provider for the coder type", () => {
		expect(getSandboxProvider("coder")).toBeInstanceOf(CoderProvider);
	});

	it("returns the e2b provider for the e2b type", () => {
		expect(getSandboxProvider("e2b")).toBeInstanceOf(E2BProvider);
	});
});

describe("CoderProvider", () => {
	it("derives Coder sandbox paths from a single repo workspace", () => {
		expect(
			new CoderProvider().getSandboxPaths([
				{ repoUrl: "https://github.com/acme/api.git", workspacePath: "." },
			]),
		).toEqual({
			homeDir: "/home/coder",
			workspaceDir: "/home/coder/project/api",
		});
	});

	it("keeps the shared project root for multi-repo Coder workspaces", () => {
		expect(
			new CoderProvider().getSandboxPaths([
				{ repoUrl: "https://github.com/acme/api.git", workspacePath: "api" },
				{ repoUrl: "https://github.com/acme/web.git", workspacePath: "web" },
			]),
		).toEqual({
			homeDir: "/home/coder",
			workspaceDir: "/home/coder/project",
		});
	});

	it("returns explicit not implemented errors for snapshot operations", async () => {
		await expect(new CoderProvider().snapshot("session", "workspace")).rejects.toThrow(
			"not implemented yet",
		);
	});

	it("keeps E2B sandbox paths on the legacy layout", () => {
		expect(new E2BProvider().getSandboxPaths()).toEqual({
			homeDir: "/home/user",
			workspaceDir: "/home/user/workspace",
		});
	});
});
