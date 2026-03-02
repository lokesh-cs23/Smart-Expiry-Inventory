import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const items = pgTable("items", {
  id: serial("id").primaryKey(),

  name: text("name").notNull(),

  expiryDate: text("expiry_date").notNull(),

  quantity: integer("quantity")
    .notNull()
    .default(1),

  category: text("category").notNull(),

  // Keep DB column name same to avoid migration issues
  email: text("phone_number").nullable(),

  barcode: text("barcode").nullable(),

  createdAt: timestamp("created_at", {
    withTimezone: false,
  }).defaultNow(),

  lastAlertSent: text("last_alert_sent").nullable(),

  isArchived: boolean("is_archived")
    .notNull()
    .default(false),
});

export const insertItemSchema = createInsertSchema(items)
  .omit({
    id: true,
    createdAt: true,
    lastAlertSent: true,
  })
  .extend({
    quantity: z.coerce.number().min(1).default(1),
    isArchived: z.boolean().optional().default(false),
    email: z.string().email("Invalid email address").optional().nullable(),
  });

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

export type CreateItemRequest = InsertItem;
export type UpdateItemRequest = Partial<InsertItem>;

export interface ItemStats {
  total: number;
  expired: number;
  expiringSoon: number;
  safe: number;
}
