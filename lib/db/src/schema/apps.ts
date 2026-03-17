import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appsTable = pgTable("apps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  iconUrl: text("icon_url"),
  category: text("category").default("app"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAppSchema = createInsertSchema(appsTable).omit({ id: true, createdAt: true });
export type InsertApp = z.infer<typeof insertAppSchema>;
export type App = typeof appsTable.$inferSelect;
