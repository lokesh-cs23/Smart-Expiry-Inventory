import cron from "node-cron";
import { db } from "./db.js";
import { items } from "../shared/schema.js";
import { sendEmailAlert } from "./email_service.js";

cron.schedule("* * * * *", async () => {
  console.log("🔍 Running expiry check...");

  try {
    const allItems = await db.select().from(items);
    const today = new Date();

    for (const item of allItems) {
      if (!item.email) continue;

      const expiry = new Date(item.expiryDate);
      const diffDays = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays >= 0 && diffDays <= 2) {
        console.log(`📧 Sending alert for ${item.name}`);
        await sendEmailAlert(item, diffDays);
      }
    }
  } catch (error) {
    console.error("❌ Expiry check failed:", error);
  }
});
