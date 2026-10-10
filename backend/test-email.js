require("dotenv").config();
const nodemailer = require("nodemailer");

async function testGmailConnection() {
  console.log("\n=======================================================");
  console.log("🔍 RentWheels Gmail SMTP Diagnostic Test");
  console.log("=======================================================\n");

  const user = (process.env.SMTP_USER || "").trim();
  const rawPass = (process.env.SMTP_PASS || "").trim();
  const pass = rawPass.replace(/\s+/g, ""); // strip spaces
  const to = process.argv[2] || user;

  console.log(`Configured SMTP_USER: ${user || "(EMPTY - Not configured!)"}`);
  console.log(`Configured SMTP_PASS: ${rawPass ? `****${rawPass.slice(-4)} (${pass.length} chars)` : "(EMPTY - Not configured!)"}`);

  if (!user || !rawPass) {
    console.error("\n❌ ERROR: SMTP_USER and SMTP_PASS are empty in backend/.env!");
    console.error("👉 Open backend/.env and add your Gmail address and 16-digit Google App Password.");
    console.error("👉 Instructions: https://myaccount.google.com/apppasswords\n");
    process.exit(1);
  }

  console.log("\n⏳ Verifying connection with Google's SMTP servers...");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });

  try {
    await transporter.verify();
    console.log("✅ SUCCESS: Successfully authenticated with Google Gmail SMTP server!\n");

    if (to) {
      console.log(`⏳ Sending test verification email to: ${to}...`);
      const info = await transporter.sendMail({
        from: `"RentWheels Marketplace" <${user}>`,
        to,
        subject: "123456 is your RentWheels test verification code",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px;">
            <h2 style="color: #2563eb;">RentWheels Test Email</h2>
            <p>Your Gmail SMTP setup is working perfectly!</p>
            <div style="background: #eff6ff; border: 2px dashed #3b82f6; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1e40af;">
              123456
            </div>
            <p style="color: #64748b; font-size: 12px; margin-top: 16px;">Sent from ${user} via RentWheels Marketplace</p>
          </div>
        `
      });
      console.log(`✅ EMAIL SENT! Message ID: ${info.messageId}`);
      console.log(`📬 Check your Gmail inbox (or Spam folder) for: ${to}\n`);
    }
  } catch (error) {
    console.error("\n❌ Gmail SMTP Error:", error.message);
    if (error.message.includes("535") || error.message.includes("BadCredentials") || error.message.includes("Username and Password not accepted")) {
      console.error("\n👉 REASON: Invalid password. You MUST use a 16-character Google 'App Password', NOT your standard Gmail login password.");
      console.error("👉 Create one at: https://myaccount.google.com/apppasswords");
    }
    process.exit(1);
  }
}

testGmailConnection();
