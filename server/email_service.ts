import { Resend } from "resend";
import { type Item } from "@shared/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailAlert(
  items: Item[]
): Promise<boolean> {

  if (!items.length) return false;

  const email = items[0].email;

  if (!email) {
    console.warn("⚠ No email provided");
    return false;
  }

  try {

    let itemsHtml = "";

    items.forEach((item) => {

      const today = new Date();
      const expiry = new Date(item.expiryDate);

      const diffDays = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const totalDays = 10; // assumed max window
      const progress = Math.max(0, Math.min(100, (diffDays / totalDays) * 100));

      let color = "#22c55e";
      let status = "Safe";

      if (diffDays === 0) {
        color = "#ef4444";
        status = "Expires Today";
      } else if (diffDays <= 2) {
        color = "#f59e0b";
        status = "Expiring Soon";
      }

      itemsHtml += `
      <div style="
        border:1px solid #e5e7eb;
        border-radius:10px;
        padding:18px;
        margin-bottom:15px;
        background:#fafafa;
      ">

        <p><strong>📦 ${item.name}</strong></p>
        <p>Expiry Date: ${item.expiryDate}</p>
        <p>Quantity: ${item.quantity}</p>

        <p style="margin-top:8px;">
          <strong>⏳ ${diffDays} day(s) remaining</strong>
        </p>

        <div style="
          height:8px;
          background:#e5e7eb;
          border-radius:5px;
          overflow:hidden;
          margin-top:10px;
        ">
          <div style="
            width:${progress}%;
            height:8px;
            background:${color};
          "></div>
        </div>

        <div style="margin-top:10px;">
          <span style="
            background:${color};
            color:white;
            padding:5px 10px;
            border-radius:20px;
            font-size:12px;
            font-weight:bold;
          ">
            ${status}
          </span>
        </div>

      </div>
      `;
    });

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px;">
      
      <div style="
        max-width:650px;
        margin:auto;
        background:white;
        border-radius:12px;
        overflow:hidden;
        box-shadow:0 6px 18px rgba(0,0,0,0.08);
      ">

        <div style="
          background:#111827;
          color:white;
          padding:22px;
          text-align:center;
        ">
          <h2 style="margin:0;">Smart Expiry Manager</h2>
          <p style="margin:5px 0 0;">Expiry Notification Summary</p>
        </div>

        <div style="padding:25px;">

          <h3>⚠ Items Nearing Expiry</h3>

          <p>
            The following items in your inventory are approaching their expiry dates.
            Please review them below.
          </p>

          ${itemsHtml}

          <p style="margin-top:20px;">
            Please make sure to use these items before they expire.
          </p>

        </div>

        <div style="
          background:#f3f4f6;
          text-align:center;
          padding:12px;
          font-size:12px;
          color:#6b7280;
        ">
          Automated alert from Smart Expiry Management System
        </div>

      </div>

    </div>
    `;

    await resend.emails.send({
      from: "Smart Expiry <onboarding@resend.dev>",
      to: email,
      subject: `⚠ ${items.length} item(s) nearing expiry`,
      html: htmlContent,
    });

    console.log("✅ Email summary sent via Resend");
    return true;

  } catch (error) {
    console.error("❌ Resend email failed:", error);
    return false;
  }
}
