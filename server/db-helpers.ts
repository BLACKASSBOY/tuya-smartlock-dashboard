import { eq, desc, and, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import {
  accessCodes,
  lockSchedules,
  activityLogs,
  InsertAccessCode,
  InsertLockSchedule,
  InsertActivityLog,
} from "../drizzle/schema";

/**
 * Access Code Management
 */

export async function createAccessCode(data: InsertAccessCode) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(accessCodes).values(data);
  return result;
}

export async function getAccessCodesByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(accessCodes)
    .where(eq(accessCodes.userId, userId))
    .orderBy(desc(accessCodes.createdAt));
}

export async function getAccessCodeById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(accessCodes)
    .where(eq(accessCodes.id, id))
    .limit(1);

  return result[0] || null;
}

export async function deleteAccessCode(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(accessCodes).where(eq(accessCodes.id, id));
}

export async function freezeAccessCode(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(accessCodes)
    .set({ isFrozen: 1 })
    .where(eq(accessCodes.id, id));
}

export async function unfreezeAccessCode(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(accessCodes)
    .set({ isFrozen: 0 })
    .where(eq(accessCodes.id, id));
}

/**
 * Lock Schedule Management
 */

export async function createLockSchedule(data: InsertLockSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(lockSchedules).values(data);
  return result;
}

export async function getLockSchedulesByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(lockSchedules)
    .where(eq(lockSchedules.userId, userId))
    .orderBy(desc(lockSchedules.createdAt));
}

export async function getLockScheduleById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(lockSchedules)
    .where(eq(lockSchedules.id, id))
    .limit(1);

  return result[0] || null;
}

export async function updateLockSchedule(
  id: number,
  data: Partial<InsertLockSchedule>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(lockSchedules).set(data).where(eq(lockSchedules.id, id));
}

export async function deleteLockSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(lockSchedules).where(eq(lockSchedules.id, id));
}

export async function toggleLockSchedule(id: number, isEnabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(lockSchedules)
    .set({ isEnabled: isEnabled ? 1 : 0 })
    .where(eq(lockSchedules.id, id));
}

/**
 * Activity Log Management
 */

export async function createActivityLog(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(activityLogs).values(data);
  return result;
}

export async function getActivityLogsByUser(
  userId: number,
  startTime?: Date,
  endTime?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(activityLogs.userId, userId)];

  if (startTime && endTime) {
    conditions.push(gte(activityLogs.eventTime, startTime));
    conditions.push(lte(activityLogs.eventTime, endTime));
  }

  return await db
    .select()
    .from(activityLogs)
    .where(and(...conditions))
    .orderBy(desc(activityLogs.eventTime));
}

export async function getActivityLogsByType(userId: number, eventType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        eq(activityLogs.eventType, eventType)
      )
    )
    .orderBy(desc(activityLogs.eventTime));
}

export async function deleteActivityLog(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(activityLogs).where(eq(activityLogs.id, id));
}

export async function getActivityLogStats(userId: number, days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const conditions = [
    eq(activityLogs.userId, userId),
    gte(activityLogs.eventTime, startDate),
  ];

  return await db
    .select()
    .from(activityLogs)
    .where(and(...conditions))
    .orderBy(desc(activityLogs.eventTime));
}
