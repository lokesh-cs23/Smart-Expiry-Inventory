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
  // Check for required email env vars
  if (!process.env.EMAIL_ADDRESS || !process.env.EMAIL_PASSWORD) {
    console.warn("\x1b[33m%s\x1b[0m", "⚠️ WARNING: EMAIL_ADDRESS or EMAIL_PASSWORD environment variables are missing. Email alerts will not function.");
  }

  app.get(api.items.list.path, async (req, res) => {
    const items = await storage.getItems();
    res.json(items);
  });

  app.get(api.items.stats.path, async (req, res) => {
    const items = await storage.getItems();
    let total = 0, expired = 0, expiringSoon = 0, safe = 0;
    const now = new Date();
    
    items.forEach(item => {
      if (item.isArchived) return;
      total++;
      const expiry = new Date(item.expiryDate);
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        expired++;
      } else if (diffDays <= 3) {
        expiringSoon++;
      } else {
        safe++;
      }
    });

    res.json({ total, expired, expiringSoon, safe });
  });

  app.get(api.items.get.path, async (req, res) => {
    const item = await storage.getItem(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  });

  // Test email route
  app.post("/api/test-email/:id", async (req, res) => {
    const item = await storage.getItem(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    if (!item.email) {
      return res.status(400).json({ message: "Item has no email address" });
    }

    const expiry = new Date(item.expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const success = await sendEmailAlert(item, diffDays);
    if (success) {
      res.json({ success: true, message: `Test email sent to ${item.email}` });
    } else {
      res.status(500).json({ success: false, message: "Failed to send test email. Check server logs." });
    }
  });

  app.post(api.items.create.path, async (req, res) => {
    try {
      const input = api.items.create.input.parse(req.body);
      const item = await storage.createItem(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.items.update.path, async (req, res) => {
    try {
      const input = api.items.update.input.parse(req.body);
      const item = await storage.updateItem(Number(req.params.id), input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.items.delete.path, async (req, res) => {
    await storage.deleteItem(Number(req.params.id));
    res.status(204).send();
  });

  app.post(api.items.bulkDelete.path, async (req, res) => {
    const input = api.items.bulkDelete.input.parse(req.body);
    await storage.bulkDelete(input.ids);
    res.json({ success: true });
  });

  app.get(api.items.lookupBarcode.path, async (req, res) => {
    const barcode = req.params.barcode;
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      if (!response.ok) throw new Error("API failed");
      const data = await response.json() as any;
      if (data && data.product && data.product.product_name) {
        return res.json({ name: data.product.product_name });
      }
      return res.status(404).json({ message: "Product not found" });
    } catch (error) {
      return res.status(404).json({ message: "Product not found" });
    }
  });

  // Seed DB if empty
  const all = await storage.getItems();
  if (all.length === 0) {
    const today = new Date();
    
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 10);
    
    const soonDate = new Date();
    soonDate.setDate(today.getDate() + 2);
    
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 2);

    await storage.createItem({ name: "Milk", expiryDate: soonDate.toISOString().split('T')[0], quantity: 2, category: "Grocery" });
    await storage.createItem({ name: "Aspirin", expiryDate: pastDate.toISOString().split('T')[0], quantity: 1, category: "Medicine" });
    await storage.createItem({ name: "Cereal", expiryDate: futureDate.toISOString().split('T')[0], quantity: 5, category: "Grocery" });
  }

  startScheduler();

  return httpServer;
}

async function startScheduler() {
  const cron = await import('node-cron');
  
  cron.schedule('0 8 * * *', async () => {
    console.log("Running daily expiry check...");
    const items = await storage.getItems();
    const now = new Date();
    
    for (const item of items) {
      if (item.isArchived || !item.email) continue;
      
      const expiry = new Date(item.expiryDate);
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 3) {
        const todayStr = now.toISOString().split('T')[0];
        if (item.lastAlertSent === todayStr) continue;
        
        const success = await sendEmailAlert(item, diffDays);
        if (success) {
          console.log(`Sent Email alert to ${item.email} for ${item.name}`);
          await storage.updateItem(item.id, { lastAlertSent: todayStr });
        }
      }
    }
  });
  console.log("Email Alert Scheduler started. Runs at 8:00 AM daily.");
}
