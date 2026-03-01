import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { sendEmailAlert } from "./email_service";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  if (!process.env.EMAIL_ADDRESS || !process.env.EMAIL_PASSWORD) {
    console.warn(
      "\x1b[33m%s\x1b[0m",
      "⚠️ EMAIL_ADDRESS or EMAIL_PASSWORD missing. Email alerts disabled."
    );
  }

  // ---------------- ITEMS LIST ----------------

  app.get(api.items.list.path, async (_req, res) => {
    const items = await storage.getItems();
    res.json(items);
  });

  // ---------------- STATS ----------------

  app.get(api.items.stats.path, async (_req, res) => {
    const items = await storage.getItems();
    let total = 0,
      expired = 0,
      expiringSoon = 0,
      safe = 0;

    const now = new Date();

    items.forEach((item) => {
      if (item.isArchived) return;

      total++;
      const expiry = new Date(item.expiryDate);
      const diffDays = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays < 0) expired++;
      else if (diffDays <= 3) expiringSoon++;
      else safe++;
    });

    res.json({ total, expired, expiringSoon, safe });
  });

  // ---------------- GET SINGLE ITEM ----------------

  app.get(api.items.get.path, async (req, res) => {
    const item = await storage.getItem(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  });

  // ---------------- BARCODE LOOKUP ----------------

  app.get(api.items.lookupBarcode.path, async (req, res) => {
    const barcode = req.params.barcode;

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );

      if (!response.ok) {
        return res.status(404).json({ message: "Product not found" });
      }

      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;

        const name =
          product.product_name ||
          product.product_name_en ||
          product.generic_name ||
          product.brands ||
          null;

        if (name) {
          return res.json({ name });
        }
      }

      return res.status(404).json({ message: "Product not found" });

    } catch (error) {
      console.error("Barcode lookup error:", error);
      return res.status(500).json({ message: "Lookup failed" });
    }
  });

  // ---------------- TEST EMAIL ----------------

  app.post("/api/test-email/:id", async (req, res) => {
    const item = await storage.getItem(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (!item.email)
      return res.status(400).json({ message: "Item has no email address" });

    const diffDays = Math.ceil(
      (new Date(item.expiryDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );

    try {
      const success = await sendEmailAlert(item, diffDays);
      if (success)
        return res.json({
          success: true,
          message: `Test email sent to ${item.email}`,
        });

      return res.status(500).json({
        success: false,
        message: "Failed to send test email",
      });
    } catch (err) {
      console.error("Test email failed:", err);
      return res.status(500).json({ success: false });
    }
  });

  // ---------------- CREATE ----------------

  app.post(api.items.create.path, async (req, res) => {
    try {
      const input = api.items.create.input.parse(req.body);
      const item = await storage.createItem(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ---------------- UPDATE ----------------

  app.put(api.items.update.path, async (req, res) => {
    try {
      const input = api.items.update.input.parse(req.body);
      const item = await storage.updateItem(
        Number(req.params.id),
        input
      );
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // ---------------- DELETE ----------------

  app.delete(api.items.delete.path, async (req, res) => {
    await storage.deleteItem(Number(req.params.id));
    res.status(204).send();
  });

  app.post(api.items.bulkDelete.path, async (req, res) => {
    const input = api.items.bulkDelete.input.parse(req.body);
    await storage.bulkDelete(input.ids);
    res.json({ success: true });
  });

  // ---------------- SAFE DATABASE SEED ----------------

  try {
    const all = await storage.getItems();

    if (all.length === 0) {
      const today = new Date();

      const future = new Date();
      future.setDate(today.getDate() + 10);

      const soon = new Date();
      soon.setDate(today.getDate() + 2);

      const past = new Date();
      past.setDate(today.getDate() - 2);

      await storage.createItem({
        name: "Milk",
        expiryDate: soon.toISOString().split("T")[0],
        quantity: 2,
        category: "Grocery",
      });

      await storage.createItem({
        name: "Aspirin",
        expiryDate: past.toISOString().split("T")[0],
        quantity: 1,
        category: "Medicine",
      });

      await storage.createItem({
        name: "Cereal",
        expiryDate: future.toISOString().split("T")[0],
        quantity: 5,
        category: "Grocery",
      });

      console.log("Database seeded.");
    }
  } catch (error) {
    console.error("Database seed failed (non-fatal):", error);
  }

  try {
    startScheduler();
  } catch (error) {
    console.error("Scheduler failed to start:", error);
  }

  return httpServer;
}

// ---------------- SCHEDULER ----------------

async function startScheduler() {
  const cron = await import("node-cron");

  cron.schedule("0 8 * * *", async () => {
    try {
      console.log("Running daily expiry check...");

      const items = await storage.getItems();
      const now = new Date();

      for (const item of items) {
        if (item.isArchived || !item.email) continue;

        const diffDays = Math.ceil(
          (new Date(item.expiryDate).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (diffDays >= 0 && diffDays <= 3) {
          const todayStr = now.toISOString().split("T")[0];
          if (item.lastAlertSent === todayStr) continue;

          const success = await sendEmailAlert(item, diffDays);

          if (success) {
            await storage.updateItem(item.id, {
              lastAlertSent: todayStr,
            });
            console.log(`Alert sent to ${item.email}`);
          }
        }
      }
    } catch (err) {
      console.error("Scheduler job failed:", err);
    }
  });

  console.log("Email Alert Scheduler started (8:00 AM daily).");
}
