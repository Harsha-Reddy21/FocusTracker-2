import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
});

export const blockedSites = pgTable("blocked_sites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  domain: text("domain").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBlockedSiteSchema = createInsertSchema(blockedSites).pick({
  userId: true,
  domain: true,
});

export const timerSettings = pgTable("timer_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  workDuration: integer("work_duration").notNull().default(25), // minutes
  shortBreakDuration: integer("short_break_duration").notNull().default(5), // minutes
  longBreakDuration: integer("long_break_duration").notNull().default(15), // minutes
  longBreakInterval: integer("long_break_interval").notNull().default(4), // pomodoros
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  soundVolume: integer("sound_volume").notNull().default(75), // percentage
  soundType: text("sound_type").notNull().default("bell"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTimerSettingsSchema = createInsertSchema(timerSettings).pick({
  userId: true,
  workDuration: true,
  shortBreakDuration: true,
  longBreakDuration: true,
  longBreakInterval: true,
  soundEnabled: true,
  notificationsEnabled: true,
  soundVolume: true,
  soundType: true,
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull().default("Focus Session"),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  pomodorosCompleted: integer("pomodoros_completed").notNull().default(0),
  totalFocusTime: integer("total_focus_time").notNull().default(0), // seconds
  isCompleted: boolean("is_completed").notNull().default(false),
  isInterrupted: boolean("is_interrupted").notNull().default(false),
  interruptionReason: text("interruption_reason"),
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  name: true,
  startTime: true,
});

export const updateSessionSchema = createInsertSchema(sessions).pick({
  endTime: true,
  pomodorosCompleted: true,
  totalFocusTime: true, 
  isCompleted: true,
  isInterrupted: true,
  interruptionReason: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type BlockedSite = typeof blockedSites.$inferSelect;
export type InsertBlockedSite = z.infer<typeof insertBlockedSiteSchema>;

export type TimerSetting = typeof timerSettings.$inferSelect;
export type InsertTimerSetting = z.infer<typeof insertTimerSettingsSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type UpdateSession = z.infer<typeof updateSessionSchema>;

export const SessionType = z.enum(["Deep Work", "Quick Task", "Project Planning", "Reading", "Custom"]);
export type SessionTypeEnum = z.infer<typeof SessionType>;
