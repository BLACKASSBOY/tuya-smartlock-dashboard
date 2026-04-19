import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getLockStatus,
  lockDoor,
  unlockDoor,
  createTempPassword,
  getTempPasswords,
  deleteTempPassword,
  freezeTempPassword,
  unfreezeTempPassword,
  getUnlockHistory,
  getAlarmHistory,
} from "./tuya";
import {
  createAccessCode,
  getAccessCodesByUser,
  getAccessCodeById,
  deleteAccessCode,
  freezeAccessCode,
  unfreezeAccessCode,
  createLockSchedule,
  getLockSchedulesByUser,
  getLockScheduleById,
  updateLockSchedule,
  deleteLockSchedule,
  toggleLockSchedule,
  createActivityLog,
  getActivityLogsByUser,
  getActivityLogsByType,
  getActivityLogStats,
} from "./db-helpers";

export const smartlockRouter = router({
  /**
   * Lock Control
   */
  getLockStatus: protectedProcedure.query(async () => {
    try {
      const status = await getLockStatus();
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: message,
      };
    }
  }),

  lockDoor: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await lockDoor();

      // Log the action
      await createActivityLog({
        userId: ctx.user.id,
        eventType: "lock",
        eventName: "Door locked",
        eventTime: new Date(),
      });

      return {
        success: true,
        message: "Door locked successfully",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: message,
      };
    }
  }),

  unlockDoor: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await unlockDoor();

      // Log the action
      await createActivityLog({
        userId: ctx.user.id,
        eventType: "unlock",
        eventName: "Door unlocked",
        eventTime: new Date(),
      });

      return {
        success: true,
        message: "Door unlocked successfully",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: message,
      };
    }
  }),

  /**
   * Access Code Management
   */
  createAccessCode: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        validityDays: z.number().min(1).max(365),
        expirationTime: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const tempPassword = await createTempPassword(
          input.name,
          input.validityDays,
          input.expirationTime
        );

        // Save to database
        await createAccessCode({
          userId: ctx.user.id,
          passwordId: tempPassword.password_id,
          name: input.name,
          code: tempPassword.password,
          effectiveTime: tempPassword.effective_time
            ? new Date(tempPassword.effective_time * 1000)
            : undefined,
          expireTime: tempPassword.expire_time
            ? new Date(tempPassword.expire_time * 1000)
            : undefined,
        });

        return {
          success: true,
          data: {
            passwordId: tempPassword.password_id,
            code: tempPassword.password,
            name: input.name,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: message,
        };
      }
    }),

  getAccessCodes: protectedProcedure.query(async ({ ctx }) => {
    try {
      const codes = await getAccessCodesByUser(ctx.user.id);
      return {
        success: true,
        data: codes,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: message,
      };
    }
  }),

  deleteAccessCode: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const code = await getAccessCodeById(input.id);
        if (!code || code.userId !== ctx.user.id) {
          return {
            success: false,
            error: "Access code not found",
          };
        }

        // Delete from Tuya
        await deleteTempPassword(code.passwordId);

        // Delete from database
        await deleteAccessCode(input.id);

        return {
          success: true,
          message: "Access code deleted successfully",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: message,
        };
      }
    }),

  freezeAccessCode: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const code = await getAccessCodeById(input.id);
        if (!code || code.userId !== ctx.user.id) {
          return {
            success: false,
            error: "Access code not found",
          };
        }

        // Freeze in Tuya
        await freezeTempPassword(code.passwordId);

        // Update database
        await freezeAccessCode(input.id);

        return {
          success: true,
          message: "Access code frozen successfully",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: message,
        };
      }
    }),

  unfreezeAccessCode: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const code = await getAccessCodeById(input.id);
        if (!code || code.userId !== ctx.user.id) {
          return {
            success: false,
            error: "Access code not found",
          };
        }

        // Unfreeze in Tuya
        await unfreezeTempPassword(code.passwordId);

        // Update database
        await unfreezeAccessCode(input.id);

        return {
          success: true,
          message: "Access code unfrozen successfully",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: message,
        };
      }
    }),

  /**
   * Activity Log Management
   */
  getActivityLogs: protectedProcedure
    .input(
      z.object({
        startTime: z.date().optional(),
        endTime: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const logs = await getActivityLogsByUser(
          ctx.user.id,
          input.startTime,
          input.endTime
        );
        return {
          success: true,
          data: logs,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: message,
        };
      }
    }),

  syncActivityLogs: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Fetch unlock history from Tuya
      const unlockRecords = await getUnlockHistory();
      for (const record of unlockRecords) {
        await createActivityLog({
          userId: ctx.user.id,
          eventType: "unlock",
          eventName: record.operate_name || "Unlock",
          eventTime: record.operate_time
            ? new Date(record.operate_time * 1000)
            : new Date(),
          operateId: record.operate_id,
          operateName: record.operate_name,
        });
      }

      // Fetch alarm history from Tuya
      const alarmRecords = await getAlarmHistory();
      for (const record of alarmRecords) {
        await createActivityLog({
          userId: ctx.user.id,
          eventType: "alarm",
          eventName: record.alarm_name || "Alarm",
          eventTime: record.time
            ? new Date(record.time * 1000)
            : new Date(),
        });
      }

      return {
        success: true,
        message: "Activity logs synced successfully",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: message,
      };
    }
  }),

  /**
   * Lock Schedule Management
   */
  createLockSchedule: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        lockTime: z.string().regex(/^\d{2}:\d{2}$/),
        daysOfWeek: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await createLockSchedule({
          userId: ctx.user.id,
          name: input.name,
          lockTime: input.lockTime,
          daysOfWeek: input.daysOfWeek,
        });

        return {
          success: true,
          data: {
            name: input.name,
            lockTime: input.lockTime,
            daysOfWeek: input.daysOfWeek,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: message,
        };
      }
    }),

  getLockSchedules: protectedProcedure.query(async ({ ctx }) => {
    try {
      const schedules = await getLockSchedulesByUser(ctx.user.id);
      return {
        success: true,
        data: schedules,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: message,
      };
    }
  }),

  updateLockSchedule: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        lockTime: z.string().optional(),
        daysOfWeek: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const schedule = await getLockScheduleById(input.id);
        if (!schedule || schedule.userId !== ctx.user.id) {
          return {
            success: false,
            error: "Schedule not found",
          };
        }

        await updateLockSchedule(input.id, {
          name: input.name,
          lockTime: input.lockTime,
          daysOfWeek: input.daysOfWeek,
        });

        return {
          success: true,
          message: "Schedule updated successfully",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: message,
        };
      }
    }),

  deleteLockSchedule: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const schedule = await getLockScheduleById(input.id);
        if (!schedule || schedule.userId !== ctx.user.id) {
          return {
            success: false,
            error: "Schedule not found",
          };
        }

        await deleteLockSchedule(input.id);

        return {
          success: true,
          message: "Schedule deleted successfully",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: message,
        };
      }
    }),

  toggleLockSchedule: protectedProcedure
    .input(z.object({ id: z.number(), isEnabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const schedule = await getLockScheduleById(input.id);
        if (!schedule || schedule.userId !== ctx.user.id) {
          return {
            success: false,
            error: "Schedule not found",
          };
        }

        await toggleLockSchedule(input.id, input.isEnabled);

        return {
          success: true,
          message: "Schedule toggled successfully",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: message,
        };
      }
    }),
});
