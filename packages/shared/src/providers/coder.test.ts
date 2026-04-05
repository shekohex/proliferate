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
	it("returns explicit not implemented errors for snapshot operations", async () => {
		await expect(new CoderProvider().snapshot("session", "workspace")).rejects.toThrow(
			"not implemented yet",
		);
	});
});
