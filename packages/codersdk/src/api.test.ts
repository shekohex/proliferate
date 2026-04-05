import {
	MockProvisionerJob,
	MockTemplate,
	MockTemplateVersion2,
	MockTemplateVersionParameter1,
	MockTemplateVersionParameter2,
	MockWorkspace,
	MockWorkspaceBuild,
} from "testHelpers/entities";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { API, MissingBuildParameters, getURLWithSearchParams } from "./api";
import type { CoderError } from "./errors";
import type * as TypesGen from "./typesGenerated";

describe("api.ts", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	describe("getExternalAuthDevice", () => {
		it("gets external auth device by provider", async () => {
			// given
			const deviceResponse: TypesGen.ExternalAuthDevice = {
				device_code: "d",
				user_code: "u",
				verification_uri: "https://example.com",
				expires_in: 600,
				interval: 5,
			};

			const mockFetch = vi.fn(() =>
				Promise.resolve(new Response(JSON.stringify(deviceResponse), { status: 200 })),
			);
			global.fetch = mockFetch as unknown as typeof fetch;

			// when
			const result = await API.getExternalAuthDevice("oidc");

			// then
			expect(mockFetch).toHaveBeenCalled();
			expect(result).toStrictEqual(deviceResponse);
		});
	});

	describe("getOAuth2GitHubDevice", () => {
		it("gets github device auth after setting state cookie", async () => {
			// given
			const deviceResponse: TypesGen.ExternalAuthDevice = {
				device_code: "d",
				user_code: "u",
				verification_uri: "https://example.com",
				expires_in: 600,
				interval: 5,
			};
			const state = "xyz_state_123";
			const callbackRedirectUrl = `https://coder.example.com/login/device?state=${state}`;

			const mockFetch = vi.fn((url) => {
				if (url.toString().endsWith("/callback")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						url: callbackRedirectUrl,
						json: () => Promise.resolve({}),
					} as Response);
				}
				if (url.toString().endsWith("/device")) {
					return Promise.resolve(new Response(JSON.stringify(deviceResponse), { status: 200 }));
				}
				return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
			});
			global.fetch = mockFetch as unknown as typeof fetch;

			// when
			const result = await API.getOAuth2GitHubDevice();

			// then
			expect(mockFetch).toHaveBeenCalledTimes(2);
			expect(result).toStrictEqual({ ...deviceResponse, state });
		});
	});

	describe("login", () => {
		it("should return LoginResponse", async () => {
			// given
			const loginResponse: TypesGen.LoginWithPasswordResponse = {
				session_token: "abc_123_test",
			};

			const mockFetch = vi.fn(() =>
				Promise.resolve(new Response(JSON.stringify(loginResponse), { status: 200 })),
			);
			global.fetch = mockFetch as unknown as typeof fetch;

			// when
			const result = await API.login("test", "123");

			// then
			expect(mockFetch).toHaveBeenCalled();
			expect(result).toStrictEqual(loginResponse);
		});

		it("should throw an error on 401", async () => {
			// given
			expect.assertions(1);
			const expectedError = {
				message: "Validation failed",
				errors: [{ field: "email", code: "email" }],
			};

			global.fetch = vi.fn(() =>
				Promise.resolve(
					new Response(JSON.stringify(expectedError), {
						status: 400,
						statusText: "Bad Request",
					}),
				),
			) as unknown as typeof fetch;

			try {
				await API.login("test", "123");
			} catch (error: unknown) {
				const coderError = error as CoderError;
				expect(coderError.data).toStrictEqual(expectedError);
			}
		});
	});

	describe("logout", () => {
		it("should return without erroring", async () => {
			// given
			const mockFetch = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
			global.fetch = mockFetch as unknown as typeof fetch;

			// when
			await API.logout();

			// then
			expect(mockFetch).toHaveBeenCalled();
		});
	});

	describe("getApiKey", () => {
		it("should return APIKeyResponse", async () => {
			// given
			const apiKeyResponse: TypesGen.GenerateAPIKeyResponse = {
				key: "abc_123_test",
			};
			const mockFetch = vi.fn(() =>
				Promise.resolve(new Response(JSON.stringify(apiKeyResponse), { status: 200 })),
			);
			global.fetch = mockFetch as unknown as typeof fetch;

			// when
			const result = await API.getApiKey();

			// then
			expect(mockFetch).toHaveBeenCalled();
			expect(result).toStrictEqual(apiKeyResponse);
		});
	});

	describe("getURLWithSearchParams - workspaces", () => {
		it.each<[string, TypesGen.WorkspaceFilter | undefined, string]>([
			["/api/v2/workspaces", undefined, "/api/v2/workspaces"],
			["/api/v2/workspaces", { q: "" }, "/api/v2/workspaces"],
			["/api/v2/workspaces", { q: "owner:1" }, "/api/v2/workspaces?q=owner%3A1"],
			["/api/v2/workspaces", { q: "owner:me" }, "/api/v2/workspaces?q=owner%3Ame"],
		])("Workspaces - getURLWithSearchParams(%p, %p) returns %p", (basePath, filter, expected) => {
			expect(getURLWithSearchParams(basePath, filter)).toBe(expected);
		});
	});

	describe("update", () => {
		describe("given a running workspace", () => {
			it("stops with current version before starting with the latest version", async () => {
				vi.spyOn(API, "getWorkspaceBuildParameters").mockResolvedValue([]);
				vi.spyOn(API, "getTemplateVersionRichParameters").mockResolvedValue([]);
				vi.spyOn(API, "postWorkspaceBuild").mockImplementation((_id, data) => {
					if (data.transition === "stop") {
						return Promise.resolve({
							...MockWorkspaceBuild,
							transition: "stop",
						} as TypesGen.WorkspaceBuild);
					}
					return Promise.resolve({
						...MockWorkspaceBuild,
						template_version_id: MockTemplateVersion2.id,
						transition: "start",
					} as TypesGen.WorkspaceBuild);
				});
				vi.spyOn(API, "getTemplate").mockResolvedValue({
					...MockTemplate,
					active_version_id: MockTemplateVersion2.id,
				} as TypesGen.Template);
				vi.spyOn(API, "getWorkspaceBuildByNumber").mockResolvedValue({
					...MockWorkspaceBuild,
					job: { ...MockProvisionerJob, status: "succeeded" },
				} as TypesGen.WorkspaceBuild);
				await API.updateWorkspace(MockWorkspace);

				expect(API.postWorkspaceBuild).toHaveBeenCalledWith(MockWorkspace.id, {
					transition: "stop",
				});
				expect(API.postWorkspaceBuild).toHaveBeenCalledWith(MockWorkspace.id, {
					transition: "start",
					template_version_id: MockTemplateVersion2.id,
					rich_parameter_values: [],
				});
			});

			it("fails when having missing parameters", async () => {
				vi.spyOn(API, "postWorkspaceBuild").mockResolvedValue(
					MockWorkspaceBuild as TypesGen.WorkspaceBuild,
				);
				vi.spyOn(API, "getTemplate").mockResolvedValue(MockTemplate as TypesGen.Template);
				vi.spyOn(API, "getWorkspaceBuildParameters").mockResolvedValue([]);
				vi.spyOn(API, "getTemplateVersionRichParameters").mockResolvedValue([
					MockTemplateVersionParameter1,
					{ ...MockTemplateVersionParameter2, mutable: false },
				]);

				let error = new Error();
				try {
					await API.updateWorkspace(MockWorkspace);
				} catch (e) {
					error = e as Error;
				}

				expect(error).toBeInstanceOf(MissingBuildParameters);
				expect((error as MissingBuildParameters).parameters).toEqual([
					MockTemplateVersionParameter1,
					{ ...MockTemplateVersionParameter2, mutable: false },
				]);
			});
		});
	});
});
