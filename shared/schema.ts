import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  expiryDate: text("expiry_date").notNull(), // Format: YYYY-MM-DD
  quantity: integer("quantity").notNull().default(1),
  category: text("category").notNull(), // e.g. Grocery, Medicine, Other
  email: text("phone_number"), // Use existing column name to avoid rename prompt
  barcode: text("barcode"),
  createdAt: timestamp("created_at").defaultNow(),
  lastAlertSent: text("last_alert_sent"),
  isArchived: boolean("is_archived").default(false).notNull(),
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  lastAlertSent: true,
}).extend({
  quantity: z.coerce.number().min(1).default(1),
  isArchived: z.boolean().optional().default(false),
  email: z.string().email("Invalid email address").optional().nullable(),
});

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

export type CreateItemRequest = InsertItem;
export type UpdateItemRequest = Partial<InsertItem>;
export type ItemResponse = Item;

export interface ItemStats {
  total: number;
  expired: number;
  expiringSoon: number;
  safe: number;
}
