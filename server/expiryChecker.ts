import cron from "node-cron";
import { db } from "./db";
import { items } from "@shared/schema";
import { sendEmailAlert } from "./email";

cron.schedule("* * * * *", async () => {
  // ⚠ change to "0 9 * * *" later (9AM daily)
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
