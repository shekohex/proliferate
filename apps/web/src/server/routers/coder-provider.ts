import { ORPCError } from "@orpc/server";
import { coder } from "@proliferate/services";
import {
	CoderProviderSettingsSchema,
	CoderTemplateDetailSchema,
	UpdateCoderProviderSettingsInputSchema,
} from "@proliferate/shared/contracts/coder-provider";
import { z } from "zod";
import { orgProcedure } from "./middleware";

export const coderProviderRouter = {
	getSettings: orgProcedure.output(CoderProviderSettingsSchema).handler(async ({ context }) => {
		return coder.getCoderProviderSettings(context.orgId);
	}),

	getTemplate: orgProcedure
		.input(z.object({ templateId: z.string().min(1) }))
		.output(CoderTemplateDetailSchema)
		.handler(async ({ input }) => {
			try {
				return await coder.getCoderTemplateDetail(input.templateId);
			} catch (error) {
				throw new ORPCError("BAD_REQUEST", {
					message: error instanceof Error ? error.message : "Failed to load Coder template details",
				});
			}
		}),

	updateSettings: orgProcedure
		.input(UpdateCoderProviderSettingsInputSchema)
		.output(CoderProviderSettingsSchema)
		.handler(async ({ input, context }) => {
			try {
				return await coder.updateCoderProviderSettings({
					orgId: context.orgId,
					userId: context.user.id,
					settings: input,
				});
			} catch (error) {
				if (error instanceof coder.CoderSettingsPermissionError) {
					throw new ORPCError("FORBIDDEN", { message: error.message });
				}
				throw new ORPCError("BAD_REQUEST", {
					message: error instanceof Error ? error.message : "Failed to update Coder settings",
				});
			}
		}),
};
