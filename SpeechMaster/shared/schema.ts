import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const conversions = pgTable("conversions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  text: text("text").notNull(),
  voice: varchar("voice").notNull().default("alloy"),
  speed: text("speed").notNull().default("1.0"),
  format: varchar("format").notNull().default("mp3"),
  audioPath: text("audio_path"),
  duration: integer("duration"), // in seconds
  fileSize: integer("file_size"), // in bytes
  segments: jsonb("segments"), // array of segment info
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").default(sql`now()`),
  completedAt: timestamp("completed_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConversionSchema = createInsertSchema(conversions).pick({
  text: true,
  voice: true,
  speed: true,
  format: true,
}).extend({
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer", "ash", "coral", "sage"]),
  speed: z.enum(["0.75", "1.0", "1.25", "1.5"]),
  format: z.enum(["mp3", "wav", "ogg"]),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertConversion = z.infer<typeof insertConversionSchema>;
export type Conversion = typeof conversions.$inferSelect;
