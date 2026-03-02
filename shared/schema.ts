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

  // nullable by default in older drizzle versions
  email: text("phone_number"),

  barcode: text("barcode"),

  createdAt: timestamp("created_at").defaultNow(),

  lastAlertSent: text("last_alert_sent"),

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

    email: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) =>
          !val ||
          val === "" ||
          z.string().email().safeParse(val).success,
        { message: "Invalid email address" }
      ),
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
