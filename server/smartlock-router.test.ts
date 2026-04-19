import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("smartlock router", () => {
  describe("getLockStatus", () => {
    it("should return lock status result", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.smartlock.getLockStatus();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });
  });

  describe("lockDoor", () => {
    it("should lock the door and return result", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.smartlock.lockDoor();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });
  });

  describe("unlockDoor", () => {
    it("should unlock the door and return result", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.smartlock.unlockDoor();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });
  });

  describe("getAccessCodes", () => {
    it("should return access codes list", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.smartlock.getAccessCodes();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe("createAccessCode", () => {
    it("should create an access code with valid input", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.smartlock.createAccessCode({
        name: "Test Code",
        validityDays: 7,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });

    it("should throw error on empty code name", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.smartlock.createAccessCode({
          name: "",
          validityDays: 7,
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("getLockSchedules", () => {
    it("should return lock schedules list", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.smartlock.getLockSchedules();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe("createLockSchedule", () => {
    it("should create a lock schedule with valid input", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.smartlock.createLockSchedule({
        name: "Bedtime Lock",
        lockTime: "22:00",
        daysOfWeek: "0,1,2,3,4,5,6",
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });

    it("should throw error on empty schedule name", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.smartlock.createLockSchedule({
          name: "",
          lockTime: "22:00",
          daysOfWeek: "0,1,2,3,4,5,6",
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("getActivityLogs", () => {
    it("should return activity logs", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.smartlock.getActivityLogs({});

      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe("syncActivityLogs", () => {
    it("should sync activity logs and return result", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.smartlock.syncActivityLogs();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });
  });
});
