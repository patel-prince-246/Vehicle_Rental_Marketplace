const nodemailer = require("nodemailer");

/**
 * Creates and returns a transporter.
 * If SMTP credentials are provided in .env, it uses them.
 * Otherwise, it creates a test account or falls back to logger mode so tests and local dev work seamlessly.
 */
let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback: Use ethereal / json-transport for local development & testing
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return transporter;
};

/**
 * Send an email notification
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailer = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"RentWheels Marketplace" <no-reply@rentwheels.com>',
      to,
      subject,
      html: html || text,
      text: text || html?.replace(/<[^>]*>?/gm, ""),
    };

    const info = await mailer.sendMail(mailOptions);
    console.log(`[EmailService] Email sent to ${to}: ${subject} (MessageId: ${info.messageId || "mock-id"})`);
    return { success: true, messageId: info.messageId || "mock-id" };
  } catch (error) {
    console.error("[EmailService] Error sending email:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Helper: Booking Confirmation Email
 */
const sendBookingConfirmation = async (user, booking, vehicle) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}` : "Vehicle";
  const startStr = new Date(booking.startDate).toLocaleDateString();
  const endStr = new Date(booking.endDate).toLocaleDateString();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #2563eb; margin-bottom: 8px;">RentWheels - Booking Confirmed!</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your rental booking has been received and scheduled successfully.</p>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Booking ID:</strong> ${booking.bookingid}</p>
        <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${vehicleName}</p>
        <p style="margin: 4px 0;"><strong>Rental Period:</strong> ${startStr} to ${endStr}</p>
        <p style="margin: 4px 0;"><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> ${booking.status}</p>
      </div>
      
      <p style="color: #64748b; font-size: 13px;">Thank you for choosing RentWheels Marketplace.</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Booking Confirmation - ${booking.bookingid}`,
    html,
  });
};

/**
 * Helper: Booking Status Update (Cancelled / Completed / Ongoing)
 */
const sendBookingStatusUpdate = async (user, booking, statusMessage) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #0f172a; margin-bottom: 8px;">RentWheels - Booking Update</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>The status of your booking <strong>${booking.bookingid}</strong> has been updated:</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 0; font-weight: bold; color: #1e293b;">${statusMessage}</p>
        <p style="margin: 8px 0 0 0; color: #64748b;">Current Status: <span style="text-transform: capitalize;">${booking.status}</span></p>
      </div>
      <p style="color: #64748b; font-size: 13px;">Please check your customer dashboard for more details.</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Booking Status Update - ${booking.bookingid}`,
    html,
  });
};

/**
 * Helper: Driving License Status Notification
 */
const sendLicenseStatusUpdate = async (user, status, reason = "") => {
  const isApproved = status === "verified";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: ${isApproved ? "#16a34a" : "#dc2626"}; margin-bottom: 8px;">
        ${isApproved ? "Driving License Verified ✅" : "Driving License Rejected ❌"}
      </h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>
        ${
          isApproved
            ? "Your driving license has been reviewed and verified by our administration team. You are now fully verified to rent vehicles!"
            : `Your uploaded driving license could not be approved. Reason: ${reason || "Unclear document or invalid details."}. Please upload a clear photo or copy of your license.`
        }
      </p>
      <p style="color: #64748b; font-size: 13px;">RentWheels Verification Team</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Driving License Verification: ${isApproved ? "Approved" : "Action Required"}`,
    html,
  });
};

/**
 * Helper: Payment Receipt Email
 */
const sendPaymentReceipt = async (user, payment, booking) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #16a34a; margin-bottom: 8px;">RentWheels - Payment Received</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>We received your payment for booking <strong>${booking?.bookingid || "N/A"}</strong>.</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Payment ID:</strong> ${payment.paymentid || payment._id}</p>
        <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${payment.amount}</p>
        <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${payment.paymentMethod}</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> ${payment.status}</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Payment Receipt - RentWheels`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendBookingStatusUpdate,
  sendLicenseStatusUpdate,
  sendPaymentReceipt,
};
