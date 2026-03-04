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

    let statusColor = "#22c55e";
    let statusText = "Safe";

    if (diffDays === 0) {
      statusColor = "#ef4444";
      statusText = "Expires Today";
    } else if (diffDays <= 2) {
      statusColor = "#f59e0b";
      statusText = "Expiring Soon";
    }

    const htmlContent = `
    <div style="font-family:Arial, sans-serif; background:#f4f6f8; padding:30px;">
      
      <div style="
        max-width:600px;
        margin:auto;
        background:white;
        border-radius:10px;
        overflow:hidden;
        box-shadow:0 4px 12px rgba(0,0,0,0.08);
      ">

        <div style="background:#111827; color:white; padding:20px; text-align:center;">
          <h2 style="margin:0;">Smart Expiry Manager</h2>
          <p style="margin:5px 0 0;">Automated Expiry Notification</p>
        </div>

        <div style="padding:25px;">

          <h3>⚠ Item Expiry Alert</h3>

          <p>One of your stored items is nearing its expiry date.</p>

          <div style="
            border:1px solid #e5e7eb;
            border-radius:8px;
            padding:18px;
            background:#fafafa;
            margin:20px 0;
          ">

            <p><strong>📦 Item:</strong> ${item.name}</p>
            <p><strong>📅 Expiry Date:</strong> ${item.expiryDate}</p>
            <p><strong>🔢 Quantity:</strong> ${item.quantity}</p>
            <p><strong>⏳ Days Remaining:</strong> ${diffDays}</p>

            <div style="margin-top:12px;">
              <span style="
                background:${statusColor};
                color:white;
                padding:6px 12px;
                border-radius:20px;
                font-size:12px;
                font-weight:bold;
              ">
                ${statusText}
              </span>
            </div>

        <div style="
          background:#f3f4f6;
          text-align:center;
          padding:12px;
          font-size:12px;
          color:#6b7280;
        ">
          Automated notification from Smart Expiry Management System
        </div>

      </div>

    </div>
    `;

    await resend.emails.send({
      from: "Smart Expiry <onboarding@resend.dev>",
      to: item.email,
      subject: `⚠ Expiry Reminder: ${item.name} expires in ${diffDays} day(s)`,
      html: htmlContent,
    });

    console.log("✅ Email sent via Resend");
    return true;

  } catch (error) {
    console.error("❌ Resend email failed:", error);
    return false;
  }
}
