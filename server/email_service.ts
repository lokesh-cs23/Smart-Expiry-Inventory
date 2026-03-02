import nodemailer from "nodemailer";
import { type Item } from "@shared/schema";

export async function sendEmailAlert(
  item: Item,
  diffDays: number
): Promise<boolean> {
  const emailUser = process.env.EMAIL_ADDRESS;
  const emailPass = process.env.EMAIL_PASSWORD;
  const smtpServer = process.env.SMTP_SERVER || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 587);

  if (!emailUser || !emailPass) {
    console.warn("⚠ Email disabled — credentials missing");
    return false;
  }

  if (!item.email || item.email.trim() === "") {
    console.warn("⚠ Skipping email — no recipient provided");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpServer,
      port: smtpPort,
      secure: smtpPort === 465,
      family: 4, // 🔥 IMPORTANT FIX
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
        <h2 style="color: #e11d48;">⚠️ Expiry Alert: ${item.name}</h2>
        <p>This item is nearing expiry:</p>
        <p><strong>Item:</strong> ${item.name}</p>
        <p><strong>Expiry Date:</strong> ${item.expiryDate}</p>
        <p><strong>Days Remaining:</strong> ${diffDays}</p>
        <p><strong>Quantity:</strong> ${item.quantity}</p>
        <hr />
        <small>Smart Expiry Manager</small>
      </div>
    `;

    await transporter.sendMail({
      from: `"Smart Expiry Manager" <${emailUser}>`,
      to: item.email,
      subject: `⚠️ Expiry Alert: ${item.name}`,
      text: `Reminder: ${item.name} expires on ${item.expiryDate}. Days remaining: ${diffDays}.`,
      html: htmlContent,
    });

    console.log("✅ Email sent successfully to:", item.email);
    return true;

  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return false;
  }
}
