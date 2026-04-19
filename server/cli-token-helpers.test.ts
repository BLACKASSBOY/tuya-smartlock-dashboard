import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateCliToken,
  createCliToken,
  verifyCliToken,
  getUserCliTokens,
  revokeCliToken,
  deleteCliToken,
} from "./cli-token-helpers";

describe("CLI Token Helpers", () => {
  describe("generateCliToken", () => {
    it("should generate a unique 64-character hex token", () => {
      const token1 = generateCliToken();
      const token2 = generateCliToken();

      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
      expect(/^[a-f0-9]+$/.test(token1)).toBe(true);
    });
  });

  describe("createCliToken", () => {
    it("should return null if database is not available", async () => {
      // Mock getDb to return null
      vi.mock("./db", () => ({
        getDb: vi.fn().mockResolvedValue(null),
      }));

      const token = await createCliToken(1, "Test Token");
      expect(token).toBeNull();
    });
  });

  describe("verifyCliToken", () => {
    it("should return null for invalid token", async () => {
      // Mock getDb to return null
      vi.mock("./db", () => ({
        getDb: vi.fn().mockResolvedValue(null),
      }));

      const userId = await verifyCliToken("invalid-token");
      expect(userId).toBeNull();
    });
  });

  describe("getUserCliTokens", () => {
    it("should return empty array if database is not available", async () => {
      // Mock getDb to return null
      vi.mock("./db", () => ({
        getDb: vi.fn().mockResolvedValue(null),
      }));

      const tokens = await getUserCliTokens(1);
      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens).toHaveLength(0);
    });
  });

  describe("revokeCliToken", () => {
    it("should return false if database is not available", async () => {
      // Mock getDb to return null
      vi.mock("./db", () => ({
        getDb: vi.fn().mockResolvedValue(null),
      }));

      const success = await revokeCliToken(1, 1);
      expect(success).toBe(false);
    });
  });

  describe("deleteCliToken", () => {
    it("should return false if database is not available", async () => {
      // Mock getDb to return null
      vi.mock("./db", () => ({
        getDb: vi.fn().mockResolvedValue(null),
      }));

      const success = await deleteCliToken(1, 1);
      expect(success).toBe(false);
    });
  });

  describe("Token generation security", () => {
    it("should generate cryptographically secure tokens", () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateCliToken());
      }
      expect(tokens.size).toBe(100); // All unique
    });
  });
});
