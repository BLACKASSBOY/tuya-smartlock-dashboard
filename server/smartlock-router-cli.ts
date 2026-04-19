import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createCliToken,
  getUserCliTokens,
  revokeCliToken,
  deleteCliToken,
} from "./cli-token-helpers";

export const cliTokenRouter = router({
  createCliToken: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const token = await createCliToken(ctx.user.id, input.name);
        if (!token) {
          return { success: false, error: "Failed to create CLI token" };
        }
        return {
          success: true,
          data: {
            token,
            message: "Save this token securely. You won't be able to see it again.",
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: message };
      }
    }),

  getCliTokens: protectedProcedure.query(async ({ ctx }) => {
    try {
      const tokens = await getUserCliTokens(ctx.user.id);
      const sanitized = tokens.map((t) => ({
        id: t.id,
        name: t.name,
        isActive: t.isActive,
        createdAt: t.createdAt,
        lastUsedAt: t.lastUsedAt,
      }));
      return { success: true, data: sanitized };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: message };
    }
  }),

  revokeCliToken: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const success = await revokeCliToken(input.id, ctx.user.id);
        if (!success) {
          return { success: false, error: "Failed to revoke token" };
        }
        return { success: true, message: "CLI token revoked successfully" };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: message };
      }
    }),

  deleteCliToken: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const success = await deleteCliToken(input.id, ctx.user.id);
        if (!success) {
          return { success: false, error: "Failed to delete token" };
        }
        return { success: true, message: "CLI token deleted successfully" };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: message };
      }
    }),
});
