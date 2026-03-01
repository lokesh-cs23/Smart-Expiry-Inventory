import { db } from "./db";
import { items, type InsertItem, type Item } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

export interface IStorage {
  getItems(): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, updates: Partial<InsertItem>): Promise<Item>;
  deleteItem(id: number): Promise<void>;
  bulkDelete(ids: number[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getItems(): Promise<Item[]> {
    return await db.select().from(items);
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db.insert(items).values(insertItem).returning();
    return item;
  }

  async updateItem(id: number, updates: Partial<InsertItem>): Promise<Item> {
    const [item] = await db.update(items)
      .set(updates)
      .where(eq(items.id, id))
      .returning();
    return item;
  }

  async deleteItem(id: number): Promise<void> {
    await db.delete(items).where(eq(items.id, id));
  }

  async bulkDelete(ids: number[]): Promise<void> {
    if (ids.length > 0) {
      await db.delete(items).where(inArray(items.id, ids));
    }
  }
}

export const storage = new DatabaseStorage();
