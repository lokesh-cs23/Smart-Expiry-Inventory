import { Resend } from "resend";
import { type Item } from "@shared/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailAlert(
  item: Item,
  diffDays: number
): Promise<boolean> {

  if (!item.email) {
    console.warn("⚠ No email provided");
    return false;
  }

  try {
    await resend.emails.send({
      from: "Smart Expiry <onboarding@resend.dev>",
      to: item.email,
      subject: `⚠️ Expiry Alert: ${item.name}`,
      html: `
        <h2>⚠️ Expiry Alert</h2>
        <p><strong>Item:</strong> ${item.name}</p>
        <p><strong>Expiry Date:</strong> ${item.expiryDate}</p>
        <p><strong>Days Remaining:</strong> ${diffDays}</p>
      `,
    });

    console.log("✅ Email sent via Resend");
    return true;

  } catch (error) {
    console.error("❌ Resend email failed:", error);
    return false;
  }
}
