import nodemailer from "nodemailer";
import { type Item } from "@shared/schema";

export async function sendEmailAlert(item: Item, diffDays: number): Promise<boolean> {
  const emailUser = process.env.EMAIL_ADDRESS;
  const emailPass = process.env.EMAIL_PASSWORD;
  const smtpServer = process.env.SMTP_SERVER || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 587);

  if (!emailUser || !emailPass) {
    console.error("Email configuration missing (EMAIL_ADDRESS or EMAIL_PASSWORD)");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: smtpServer,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
      <h2 style="color: #e11d48; margin-top: 0;">⚠️ Expiry Alert: ${item.name}</h2>
      <p>Hello,</p>
      <p>This is a reminder that the following item is nearing expiry:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px 0; font-weight: bold; width: 150px;">Item Name:</td><td style="padding: 8px 0;">${item.name}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Expiry Date:</td><td style="padding: 8px 0;">${item.expiryDate}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Days Remaining:</td><td style="padding: 8px 0;">${diffDays}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Quantity:</td><td style="padding: 8px 0;">${item.quantity}</td></tr>
      </table>
      <p>Please take necessary action.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #666; font-size: 12px;">Regards,<br />Smart Expiry Manager</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Smart Expiry Manager" <${emailUser}>`,
      to: item.email || "",
      subject: `⚠️ Expiry Alert: ${item.name}`,
      text: `Reminder: ${item.name} expires on ${item.expiryDate}. Days remaining: ${diffDays}.`,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
}
