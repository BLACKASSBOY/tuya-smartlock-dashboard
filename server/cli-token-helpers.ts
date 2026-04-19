import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { cliTokens, type InsertCliToken } from "../drizzle/schema";
import { randomBytes } from "crypto";

/**
 * Generate a secure random CLI token
 */
export function generateCliToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create a new CLI token for a user
 */
export async function createCliToken(
  userId: number,
  name: string,
  expiresAt?: Date
): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const token = generateCliToken();

  try {
    await db.insert(cliTokens).values({
      userId,
      token,
      name,
      expiresAt,
      isActive: 1,
    });

    return token;
  } catch (error) {
    console.error("[Database] Failed to create CLI token:", error);
    return null;
  }
}

/**
 * Verify and get user ID from CLI token
 */
export async function verifyCliToken(token: string): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select({ userId: cliTokens.userId })
      .from(cliTokens)
      .where(
        and(
          eq(cliTokens.token, token),
          eq(cliTokens.isActive, 1)
          // Note: Could add expiration check here if needed
        )
      )
      .limit(1);

    if (result.length === 0) return null;

    // Update last used timestamp
    await db
      .update(cliTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(cliTokens.token, token));

    return result[0].userId;
  } catch (error) {
    console.error("[Database] Failed to verify CLI token:", error);
    return null;
  }
}

/**
 * Get all CLI tokens for a user
 */
export async function getUserCliTokens(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(cliTokens)
      .where(eq(cliTokens.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get user CLI tokens:", error);
    return [];
  }
}

/**
 * Revoke a CLI token
 */
export async function revokeCliToken(tokenId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const result = await db
      .update(cliTokens)
      .set({ isActive: 0 })
      .where(and(eq(cliTokens.id, tokenId), eq(cliTokens.userId, userId)));

    return true;
  } catch (error) {
    console.error("[Database] Failed to revoke CLI token:", error);
    return false;
  }
}

/**
 * Delete a CLI token
 */
export async function deleteCliToken(tokenId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .delete(cliTokens)
      .where(and(eq(cliTokens.id, tokenId), eq(cliTokens.userId, userId)));

    return true;
  } catch (error) {
    console.error("[Database] Failed to delete CLI token:", error);
    return false;
  }
}
