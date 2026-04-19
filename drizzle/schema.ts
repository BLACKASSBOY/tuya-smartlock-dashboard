import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Temporary access codes for guest access
 */
export const accessCodes = mysqlTable("accessCodes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  passwordId: varchar("passwordId", { length: 64 }).notNull(),
  name: text("name"),
  code: text("code"),
  effectiveTime: timestamp("effectiveTime"),
  expireTime: timestamp("expireTime"),
  isFrozen: int("isFrozen").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccessCode = typeof accessCodes.$inferSelect;
export type InsertAccessCode = typeof accessCodes.$inferInsert;

/**
 * Auto-lock scheduler rules
 */
export const lockSchedules = mysqlTable("lockSchedules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: text("name"),
  lockTime: varchar("lockTime", { length: 5 }), // HH:mm format
  daysOfWeek: varchar("daysOfWeek", { length: 20 }), // comma-separated 0-6
  isEnabled: int("isEnabled").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LockSchedule = typeof lockSchedules.$inferSelect;
export type InsertLockSchedule = typeof lockSchedules.$inferInsert;

/**
 * Activity log cache for analytics
 */
export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventType: varchar("eventType", { length: 32 }), // unlock, lock, alarm
  eventName: text("eventName"),
  eventTime: timestamp("eventTime"),
  operateId: varchar("operateId", { length: 64 }),
  operateName: text("operateName"),
  rawData: text("rawData"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * CLI authentication tokens for lock-control tool
 */
export const cliTokens = mysqlTable("cliTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  name: text("name"), // e.g., "My Laptop", "Work PC"
  isActive: int("isActive").default(1),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Optional expiration
});

export type CliToken = typeof cliTokens.$inferSelect;
export type InsertCliToken = typeof cliTokens.$inferInsert;