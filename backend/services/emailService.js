const nodemailer = require("nodemailer");

/**
 * Creates and returns a transporter.
 * If SMTP credentials are provided in .env (e.g. Gmail App Password or custom SMTP),
 * it sends real emails to inboxes.
 * Otherwise, it safely logs the email content to console so local development and testing never break.
 */
const isSmtpConfigured = () => {
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim();
  return Boolean(user && pass);
};

let transporter = null;
let lastUserConfig = null;
let testAccount = null;

const getTransporter = async () => {
  const rawUser = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const rawPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim();
  const currentConfigKey = `${rawUser}:${rawPass ? "set" : "unset"}`;

  // Reset cached transporter if credentials change
  if (transporter && lastUserConfig === currentConfigKey) {
    return transporter;
  }
  lastUserConfig = currentConfigKey;

  const user = rawUser;
  // If using Gmail, strip any internal spaces from Google App Password (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
  const pass = (user && user.includes("@gmail.com")) ? rawPass.replace(/\s+/g, "") : rawPass;
  const host = process.env.SMTP_HOST || (user && user.includes("@gmail.com") ? "smtp.gmail.com" : null);
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (user && pass) {
    try {
      if (process.env.EMAIL_SERVICE === "gmail" || (user && user.includes("@gmail.com"))) {
        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user, pass },
        });
      } else {
        transporter = nodemailer.createTransport({
          host: host || "smtp.gmail.com",
          port,
          secure,
          auth: { user, pass },
        });
      }
      console.log(`[EmailService] Connected to SMTP server using account: ${user}`);
    } catch (err) {
      console.error("[EmailService] Failed to initialize SMTP transporter:", err.message);
      transporter = null;
    }
  } else {
    // Fallback: Use Ethereal test account for real browser preview when SMTP credentials are not yet configured
    if (!testAccount) {
      try {
        testAccount = await nodemailer.createTestAccount();
      } catch (err) {
        console.warn("[EmailService] Ethereal account creation skipped:", err.message);
      }
    }

    if (testAccount) {
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return transporter;
};

/**
 * Core sendEmail helper
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!to) {
      console.warn("[EmailService] No recipient specified, skipping email dispatch.");
      return { success: false, error: "No recipient specified" };
    }

    const mailer = await getTransporter();
    const fromAddress =
      process.env.EMAIL_FROM ||
      (process.env.SMTP_USER ? `"RentWheels Marketplace" <${process.env.SMTP_USER}>` : '"RentWheels Marketplace" <no-reply@rentwheels.com>');

    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      html: html || text,
      text: text || html?.replace(/<[^>]*>?/gm, ""),
    };

    const isRealSMTP = isSmtpConfigured();
    const info = await mailer.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    if (isRealSMTP) {
      console.log(`[EmailService] Real email dispatched to ${to}: "${subject}" (MessageId: ${info.messageId})`);
    } else {
      console.log("\n=======================================================");
      console.log("📨 [RENTWHEELS DEV EMAIL DISPATCH (No SMTP in .env)]");
      console.log(`To:          ${to}`);
      console.log(`Subject:     ${subject}`);
      if (previewUrl) {
        console.log(`Preview URL: ${previewUrl}`);
      }
      console.log("Tip: Add SMTP_USER and SMTP_PASS in backend/.env to send real emails to your personal inbox.");
      console.log("=======================================================\n");
    }

    return {
      success: true,
      messageId: info.messageId || "mock-id",
      isReal: isRealSMTP,
      previewUrl,
    };
  } catch (error) {
    console.error(`[EmailService] Error sending email to ${to}:`, error.message);
    return { success: false, error: error.message, isReal: isSmtpConfigured() };
  }
};

/**
 * Helper: Send Registration OTP Email
 */
const sendRegistrationOtpEmail = async (toEmail, otp, name = "Valued User") => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 800;">RentWheels Marketplace</h2>
        <span style="color: #64748b; font-size: 13px;">Self-Drive Vehicle Rentals & Marketplace</span>
      </div>

      <p style="color: #1e293b; font-size: 16px; margin-bottom: 8px;">Hi <strong>${name}</strong>,</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        Welcome to RentWheels! To complete your account registration and verify your email address, please use the 6-digit One-Time Password (OTP) below:
      </p>

      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px dashed #3b82f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #1d4ed8; font-weight: 700; display: block; margin-bottom: 8px;">Your Verification Code</span>
        <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #1e40af; font-family: monospace;">${otp}</div>
        <span style="font-size: 12px; color: #64748b; display: block; margin-top: 10px;">Valid for 10 minutes. Do not share this code with anyone.</span>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
        If you did not request this registration, please disregard this email.
      </p>

      <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} RentWheels Marketplace. All rights reserved.
      </div>
    </div>
  `;

  const text = `Hi ${name},\n\nYour RentWheels registration verification OTP is: ${otp}\nThis code is valid for 10 minutes.\n\nThank you for choosing RentWheels Marketplace.`;

  return sendEmail({
    to: toEmail,
    subject: `${otp} is your RentWheels verification code`,
    html,
    text,
  });
};

/**
 * Helper: Booking Confirmation Email to Customer
 */
const sendBookingConfirmation = async (user, booking, vehicle) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "Vehicle";
  const startStr = new Date(booking.startDate).toLocaleDateString();
  const endStr = new Date(booking.endDate).toLocaleDateString();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #2563eb; margin-bottom: 6px;">RentWheels - Booking Request Sent!</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p style="color: #475569;">Your rental booking request has been created and sent to the vehicle host for review & confirmation.</p>
      
      <div style="background: #f8fafc; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 6px 0;"><strong>Booking Reference:</strong> #${booking.bookingid}</p>
        <p style="margin: 6px 0;"><strong>Vehicle:</strong> ${vehicleName}</p>
        <p style="margin: 6px 0;"><strong>Rental Period:</strong> ${startStr} to ${endStr}</p>
        <p style="margin: 6px 0;"><strong>Pickup Location:</strong> ${booking.pickupLocation || "Host Garage"}</p>
        <p style="margin: 6px 0;"><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
        <p style="margin: 6px 0;"><strong>Status:</strong> <span style="color: #d97706; font-weight: bold; text-transform: uppercase;">Awaiting Host Acceptance</span></p>
      </div>

      <p style="color: #475569; font-size: 13px;">
        Once the host confirms the availability, you will receive an approval email to proceed with payment and key handover.
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">Thank you for choosing RentWheels Marketplace.</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Booking Request Sent - #${booking.bookingid}`,
    html,
  });
};

/**
 * Helper: New Booking Request Notification to Host (Owner / Agency)
 * Contains details and prompts the host to accept or decline.
 */
const sendNewBookingRequestToHost = async (host, customer, booking, vehicle) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "Vehicle";
  const startStr = new Date(booking.startDate).toLocaleDateString();
  const endStr = new Date(booking.endDate).toLocaleDateString();
  const hostPayout = booking.hostEarnings > 0 ? booking.hostEarnings : Math.round(Number(booking.totalAmount || 0) * 0.85);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 18px;">
        <h2 style="color: #d97706; margin: 0; font-size: 22px;">🚗 New Booking Request - Action Required!</h2>
        <span style="color: #64748b; font-size: 13px;">Host Fleet Management</span>
      </div>

      <p>Hello <strong>${host.name || host.agencyName || "Host"}</strong>,</p>
      <p style="color: #334155;">
        A customer has submitted a new reservation request for your vehicle <strong>${vehicleName}</strong>. Please review the details below and confirm whether you will accept this reservation:
      </p>

      <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 18px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 6px 0;"><strong>Booking ID:</strong> #${booking.bookingid}</p>
        <p style="margin: 6px 0;"><strong>Vehicle:</strong> ${vehicleName} ${vehicle?.registrationNumber ? `(Plate: ${vehicle.registrationNumber})` : ""}</p>
        <p style="margin: 6px 0;"><strong>Customer Name:</strong> ${customer?.name || "Customer"}</p>
        <p style="margin: 6px 0;"><strong>Customer Contact:</strong> ${customer?.phone || "N/A"} (${customer?.email || "N/A"})</p>
        <p style="margin: 6px 0;"><strong>Rental Duration:</strong> ${startStr} &rarr; ${endStr}</p>
        <p style="margin: 6px 0;"><strong>Pickup / Drop:</strong> ${booking.pickupLocation || "Your Garage"}</p>
        <p style="margin: 6px 0;"><strong>Total Rental Value:</strong> ₹${booking.totalAmount}</p>
        <p style="margin: 6px 0; color: #15803d; font-size: 15px;"><strong>Your Net Payout (85%):</strong> ₹${hostPayout}</p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 8px 0; color: #1e293b;">How to Respond:</h4>
        <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.5;">
          Log in to your <strong>Host / Agency Dashboard</strong> &rarr; navigate to the <strong>Bookings</strong> tab &rarr; click <strong>"Accept & Confirm"</strong> to lock in the reservation, or <strong>"Decline Request"</strong> if the vehicle is unavailable.
        </p>
      </div>

      <p style="color: #64748b; font-size: 12px;">RentWheels Host Management System</p>
    </div>
  `;

  return sendEmail({
    to: host.email,
    subject: `🚗 New Booking Request #${booking.bookingid} for ${vehicleName} - Action Required`,
    html,
  });
};

/**
 * Helper: Booking Accepted by Host -> Sent to Customer
 */
const sendBookingAcceptedToCustomer = async (customer, booking, vehicle, host) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "Vehicle";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #16a34a; margin-bottom: 8px;">🎉 Your Booking Has Been Accepted!</h2>
      <p>Hi <strong>${customer.name}</strong>,</p>
      <p style="color: #334155;">
        Great news! The host has accepted your booking request for <strong>${vehicleName}</strong> (#${booking.bookingid}).
      </p>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 6px 0;"><strong>Booking ID:</strong> #${booking.bookingid}</p>
        <p style="margin: 6px 0;"><strong>Vehicle:</strong> ${vehicleName}</p>
        <p style="margin: 6px 0;"><strong>Pickup Dates:</strong> ${new Date(booking.startDate).toLocaleDateString()} to ${new Date(booking.endDate).toLocaleDateString()}</p>
        <p style="margin: 6px 0;"><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
        <p style="margin: 6px 0;"><strong>Payment Status:</strong> <span style="text-transform: capitalize;">${booking.paymentStatus}</span></p>
      </div>

      <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 14px; border-radius: 10px; margin-bottom: 20px;">
        <strong style="color: #1e40af;">Next Step: Complete Payment</strong>
        <p style="margin: 4px 0 0 0; color: #1e3a8a; font-size: 13px;">
          Please open your <strong>Customer Dashboard</strong> to pay online via Razorpay (UPI, Card, Netbanking) or choose Cash on Pickup.
        </p>
      </div>

      <p style="color: #64748b; font-size: 13px;">RentWheels Support Team</p>
    </div>
  `;

  return sendEmail({
    to: customer.email,
    subject: `🎉 Booking Approved: #${booking.bookingid} for ${vehicleName}`,
    html,
  });
};

/**
 * Helper: Booking Declined by Host -> Sent to Customer
 */
const sendBookingDeclinedToCustomer = async (customer, booking, vehicle, host, reason) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "Vehicle";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #dc2626; margin-bottom: 8px;">Booking Request Declined</h2>
      <p>Hi <strong>${customer.name}</strong>,</p>
      <p style="color: #334155;">
        We regret to inform you that the host was unable to accept your booking request for <strong>${vehicleName}</strong> (#${booking.bookingid}).
      </p>

      <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 4px 0; color: #991b1b;"><strong>Reason:</strong> ${reason || "Vehicle is currently unavailable or undergoing maintenance."}</p>
        ${booking.refundAmount > 0 ? `<p style="margin: 8px 0 0 0; color: #15803d; font-weight: bold;">Full Refund of ₹${booking.refundAmount} has been processed back to your original payment method.</p>` : ""}
      </div>

      <p style="color: #475569; font-size: 13px;">
        You can explore thousands of other verified vehicles on RentWheels right away!
      </p>
      <p style="color: #64748b; font-size: 13px;">RentWheels Support Team</p>
    </div>
  `;

  return sendEmail({
    to: customer.email,
    subject: `Booking Request Declined - #${booking.bookingid}`,
    html,
  });
};

/**
 * Helper: Vehicle Received / Handover Confirmed -> Sent to Host
 */
const sendVehicleHandoverToHost = async (host, customer, booking, vehicle) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "Vehicle";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #2563eb; margin-bottom: 8px;">🔑 Vehicle Handover Confirmed (Trip Started)</h2>
      <p>Hello <strong>${host.name || host.agencyName || "Host"}</strong>,</p>
      <p style="color: #334155;">
        Your vehicle <strong>${vehicleName}</strong> has been successfully handed over to customer <strong>${customer?.name || "Renter"}</strong> for booking <strong>#${booking.bookingid}</strong>.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Rental Status:</strong> <span style="color: #2563eb; font-weight: bold;">ONGOING</span></p>
        <p style="margin: 4px 0;"><strong>Customer Phone:</strong> ${customer?.phone || "N/A"}</p>
        <p style="margin: 4px 0;"><strong>Scheduled Return Date:</strong> ${new Date(booking.endDate).toLocaleDateString()}</p>
        <p style="margin: 4px 0;"><strong>Drop-off Location:</strong> ${booking.returnLocation || booking.pickupLocation || "Your Garage"}</p>
      </div>

      <p style="color: #64748b; font-size: 13px;">When the customer returns the vehicle, remember to inspect it and confirm the return in your dashboard.</p>
    </div>
  `;

  return sendEmail({
    to: host.email,
    subject: `🔑 Vehicle Handover Confirmed - #${booking.bookingid} (${vehicleName})`,
    html,
  });
};

/**
 * Helper: Vehicle Received by Customer -> Sent to Customer
 */
const sendVehicleReceivedToCustomer = async (customer, host, booking, vehicle) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "Vehicle";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #2563eb; margin-bottom: 8px;">🚗 Vehicle Received - Have a Safe Journey!</h2>
      <p>Hi <strong>${customer.name}</strong>,</p>
      <p style="color: #334155;">
        You have successfully received the keys for <strong>${vehicleName}</strong>. Your rental trip is officially ongoing.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Booking Reference:</strong> #${booking.bookingid}</p>
        <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${vehicleName}</p>
        <p style="margin: 4px 0;"><strong>Host Contact:</strong> ${host?.name || host?.agencyName || "Host"} (${host?.phone || "N/A"})</p>
        <p style="margin: 4px 0;"><strong>Return Deadline:</strong> ${new Date(booking.endDate).toLocaleDateString()}</p>
        <p style="margin: 4px 0;"><strong>Return Location:</strong> ${booking.returnLocation || booking.pickupLocation || "Garage"}</p>
      </div>

      <p style="color: #64748b; font-size: 13px;">Please drive carefully and adhere to traffic guidelines. Have a wonderful trip!</p>
    </div>
  `;

  return sendEmail({
    to: customer.email,
    subject: `🚗 Vehicle Handover Complete - Have a Great Trip! #${booking.bookingid}`,
    html,
  });
};

/**
 * Helper: Send Review Invitation Email to Customer (upon completion)
 */
const sendReviewRequestEmail = async (customer, booking, vehicle) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "Vehicle";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #d97706; margin-bottom: 8px;">⭐ How Was Your Trip with ${vehicleName}?</h2>
      <p>Hi <strong>${customer.name}</strong>,</p>
      <p style="color: #334155;">
        Your rental for <strong>${vehicleName}</strong> (Booking #${booking.bookingid}) has concluded. We hope you had a fantastic experience!
      </p>

      <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
        <span style="font-size: 32px; display: block; margin-bottom: 10px;">⭐⭐⭐⭐⭐</span>
        <strong style="color: #92400e; font-size: 15px; display: block; margin-bottom: 8px;">Share Your Honest Feedback</strong>
        <p style="color: #b45309; font-size: 13px; margin: 0;">
          Your ratings and comments help other community members and reward outstanding vehicle hosts.
        </p>
      </div>

      <p style="color: #475569; font-size: 13px;">
        To submit your review, please visit your <strong>Customer Dashboard</strong> &rarr; <strong>Bookings</strong> and click <strong>"Rate & Review"</strong>.
      </p>
      <p style="color: #94a3b8; font-size: 12px;">RentWheels Feedback Team</p>
    </div>
  `;

  return sendEmail({
    to: customer.email,
    subject: `⭐ How was your ride with ${vehicleName}? Leave a Review!`,
    html,
  });
};

/**
 * Helper: Send Review Notification to Host when Customer Submits a Review
 */
const sendReviewNotificationToHost = async (host, customer, review, vehicle, booking) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "Vehicle";
  const stars = "★".repeat(Number(review.rating) || 5) + "☆".repeat(Math.max(0, 5 - (Number(review.rating) || 5)));

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #2563eb; margin-bottom: 8px;">🌟 New Customer Review Received!</h2>
      <p>Hello <strong>${host.name || host.agencyName || "Host"}</strong>,</p>
      <p style="color: #334155;">
        Customer <strong>${customer?.name || "Renter"}</strong> just posted a review for your vehicle <strong>${vehicleName}</strong>:
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <div style="font-size: 24px; color: #f59e0b; margin-bottom: 8px; font-weight: bold;">
          ${stars} <span style="font-size: 16px; color: #475569;">(${review.rating} out of 5)</span>
        </div>
        <p style="font-style: italic; color: #1e293b; font-size: 14px; margin: 8px 0;">
          "${review.comment || "Great vehicle and smooth rental experience!"}"
        </p>
        <p style="color: #64748b; font-size: 12px; margin: 12px 0 0 0;">
          Review for Booking #${booking?.bookingid || "N/A"}
        </p>
      </div>

      <p style="color: #64748b; font-size: 13px;">This review is now visible on your vehicle's public marketplace page.</p>
    </div>
  `;

  return sendEmail({
    to: host.email,
    subject: `🌟 New Review (${review.rating}★) for ${vehicleName} by ${customer?.name || "Customer"}`,
    html,
  });
};

/**
 * Helper: Send Review Confirmation to Customer
 */
const sendReviewConfirmationToCustomer = async (customer, review, vehicle, booking) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "Vehicle";
  const stars = "★".repeat(Number(review.rating) || 5);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #16a34a; margin-bottom: 8px;">Thank You for Your Review!</h2>
      <p>Hi <strong>${customer.name}</strong>,</p>
      <p style="color: #334155;">
        Thank you for reviewing your recent trip with <strong>${vehicleName}</strong>. Your feedback helps make RentWheels a trusted marketplace for everyone.
      </p>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 12px; margin: 20px 0;">
        <p style="color: #15803d; font-size: 18px; margin: 0 0 6px 0;">Rating: ${stars} (${review.rating}/5)</p>
        <p style="color: #166534; font-size: 14px; font-style: italic; margin: 0;">"${review.comment || "No comment provided."}"</p>
      </div>

      <p style="color: #64748b; font-size: 13px;">RentWheels Team</p>
    </div>
  `;

  return sendEmail({
    to: customer.email,
    subject: `Thank you for your review of ${vehicleName}!`,
    html,
  });
};

/**
 * Helper: Payment Receipt Email to Customer (Razorpay / Online / Cash)
 */
const sendPaymentReceipt = async (user, payment, booking, vehicle) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "Vehicle";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #16a34a; margin-bottom: 8px;">RentWheels - Payment Received ✅</h2>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p style="color: #334155;">We have received your payment for booking <strong>#${booking?.bookingid || "N/A"}</strong>.</p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 6px 0;"><strong>Payment ID:</strong> ${payment.paymentid || payment._id}</p>
        <p style="margin: 6px 0;"><strong>Vehicle:</strong> ${vehicleName}</p>
        <p style="margin: 6px 0;"><strong>Amount Paid:</strong> ₹${payment.amount}</p>
        <p style="margin: 6px 0;"><strong>Payment Method:</strong> <span style="text-transform: uppercase; font-weight: bold;">${payment.paymentMethod}</span></p>
        <p style="margin: 6px 0;"><strong>Transaction Ref:</strong> ${payment.transactionId || "N/A"}</p>
        <p style="margin: 6px 0;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold; text-transform: uppercase;">${payment.status}</span></p>
      </div>

      <p style="color: #64748b; font-size: 13px;">This email serves as your official payment receipt for accounting.</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Payment Receipt (₹${payment.amount}) - RentWheels #${booking?.bookingid || ""}`,
    html,
  });
};

/**
 * Helper: Payment Notification to Host (Razorpay / Online / Cash)
 * Alerts the Host that payment for the booking has been completed.
 */
const sendPaymentReceiptToHost = async (host, customer, payment, booking, vehicle) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "Vehicle";
  const hostPayout = booking?.hostEarnings > 0 ? booking.hostEarnings : Math.round(Number(payment.amount || 0) * 0.85);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #16a34a; margin-bottom: 8px;">💰 Payment Confirmed - Booking #${booking?.bookingid || ""}</h2>
      <p>Hello <strong>${host.name || host.agencyName || "Host"}</strong>,</p>
      <p style="color: #334155;">
        Payment has been completed by customer <strong>${customer?.name || "Renter"}</strong> for your vehicle <strong>${vehicleName}</strong>.
      </p>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 6px 0;"><strong>Total Paid by Customer:</strong> ₹${payment.amount}</p>
        <p style="margin: 6px 0; color: #15803d; font-size: 15px;"><strong>Your Host Payout (85%):</strong> ₹${hostPayout}</p>
        <p style="margin: 6px 0;"><strong>Payment Method:</strong> <span style="text-transform: uppercase; font-weight: bold;">${payment.paymentMethod}</span></p>
        <p style="margin: 6px 0;"><strong>Transaction ID:</strong> ${payment.transactionId || "N/A"}</p>
        <p style="margin: 6px 0;"><strong>Booking Reference:</strong> #${booking?.bookingid || "N/A"}</p>
      </div>

      <p style="color: #64748b; font-size: 13px;">The payout will be cleared to your registered bank account per standard settlement terms.</p>
    </div>
  `;

  return sendEmail({
    to: host.email,
    subject: `💰 Payment Received: ₹${payment.amount} for Booking #${booking?.bookingid || ""}`,
    html,
  });
};

/**
 * Helper: Cash Payment Confirmation to Customer (when host manually confirms cash receipt)
 */
const sendCashPaymentReceipt = async (customer, host, payment, booking, vehicle) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "Vehicle";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #16a34a; margin-bottom: 8px;">💵 Cash Payment Confirmed by Host</h2>
      <p>Hi <strong>${customer.name}</strong>,</p>
      <p style="color: #334155;">
        Your vehicle host <strong>${host?.name || host?.agencyName || "Host"}</strong> has verified and marked your <strong>Cash Payment</strong> as successfully received for booking <strong>#${booking?.bookingid || ""}</strong>.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 6px 0;"><strong>Amount Paid in Cash:</strong> ₹${payment.amount}</p>
        <p style="margin: 6px 0;"><strong>Vehicle:</strong> ${vehicleName}</p>
        <p style="margin: 6px 0;"><strong>Payment Status:</strong> <span style="color: #16a34a; font-weight: bold;">PAID (CASH VERIFIED)</span></p>
        <p style="margin: 6px 0;"><strong>Confirmed At:</strong> ${new Date().toLocaleString()}</p>
      </div>

      <p style="color: #64748b; font-size: 13px;">Your booking is fully paid. Drive safely!</p>
    </div>
  `;

  return sendEmail({
    to: customer.email,
    subject: `💵 Cash Payment Confirmed (₹${payment.amount}) - #${booking?.bookingid || ""}`,
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
      <p style="color: #64748b; font-size: 13px;">Please check your dashboard for full details.</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Booking Status Update - #${booking.bookingid}`,
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
 * Helper: Handover Verification OTP to Customer
 * The host/agency initiates handover, and this OTP is dispatched to customer's email.
 * Customer shows this OTP to host/agency to take custody of the vehicle.
 */
const sendHandoverOtpToCustomer = async (customer, booking, vehicle, host, otp) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "Vehicle";
  const hostName = host?.name || host?.agencyName || "Host / Agency Representative";

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin: 0; font-size: 22px;">🔑 Vehicle Handover Verification Code</h2>
        <span style="color: #64748b; font-size: 13px;">Security &amp; Key Handover Check</span>
      </div>

      <p>Hi <strong>${customer.name || "Customer"}</strong>,</p>
      <p style="color: #334155; line-height: 1.5;">
        You are at the pickup point with <strong>${hostName}</strong> to collect your rental vehicle <strong>${vehicleName}</strong> (Booking <strong>#${booking.bookingid}</strong>).
      </p>

      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px dashed #2563eb; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #1d4ed8; font-weight: 700; display: block; margin-bottom: 8px;">Your Vehicle Handover OTP</span>
        <div style="font-size: 40px; font-weight: 900; letter-spacing: 8px; color: #1e3a8a; font-family: monospace;">${otp}</div>
        <span style="font-size: 12px; color: #64748b; display: block; margin-top: 10px;">Valid for 15 minutes. Share this code with ${hostName} ONLY after physically checking the vehicle keys and condition.</span>
      </div>

      <div style="background: #f8fafc; padding: 14px; border-radius: 8px; font-size: 13px; color: #475569; border-left: 4px solid #f59e0b;">
        <strong>Safety Tip:</strong> Inspect the vehicle for existing scratches or dents, verify fuel level, and take photos before providing this OTP.
      </div>

      <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} RentWheels Marketplace.
      </div>
    </div>
  `;

  return sendEmail({
    to: customer.email,
    subject: `🔑 [OTP: ${otp}] Handover Verification for ${vehicleName} - #${booking.bookingid}`,
    html,
    text: `Hi ${customer.name},\n\nYour Handover Verification OTP for ${vehicleName} is: ${otp}\nShare this code with your host only after inspecting the vehicle.\n\nRentWheels Marketplace`
  });
};

/**
 * Helper: Return Verification OTP to Customer
 * Host/agency initiates return verification. Customer provides OTP to confirm vehicle is returned.
 */
const sendReturnOtpToCustomer = async (customer, booking, vehicle, host, otp, penaltyInfo = null) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "Vehicle";
  const hostName = host?.name || host?.agencyName || "Host / Agency";

  const penaltyHtml = penaltyInfo && penaltyInfo.isLate ? `
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin: 16px 0; color: #991b1b; font-size: 13px;">
      <strong>⚠️ Late Return Alert:</strong> This return is past the scheduled return time by <strong>${penaltyInfo.lateHours} hour(s)</strong>.
      An additional late penalty of <strong>₹${penaltyInfo.penaltyAmount}</strong> is calculated per rental policy.
    </div>
  ` : "";

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #16a34a; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #15803d; margin: 0; font-size: 22px;">🏁 Vehicle Return Verification Code</h2>
        <span style="color: #64748b; font-size: 13px;">Return &amp; Trip Completion Check</span>
      </div>

      <p>Hi <strong>${customer.name || "Customer"}</strong>,</p>
      <p style="color: #334155; line-height: 1.5;">
        You are completing the return process of <strong>${vehicleName}</strong> (Booking <strong>#${booking.bookingid}</strong>) with <strong>${hostName}</strong>.
      </p>

      ${penaltyHtml}

      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px dashed #16a34a; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #166534; font-weight: 700; display: block; margin-bottom: 8px;">Your Return Verification OTP</span>
        <div style="font-size: 40px; font-weight: 900; letter-spacing: 8px; color: #14532d; font-family: monospace;">${otp}</div>
        <span style="font-size: 12px; color: #64748b; display: block; margin-top: 10px;">Valid for 15 minutes. Share this code with ${hostName} to finalize the vehicle return and unlock security deposit settlement.</span>
      </div>

      <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} RentWheels Marketplace.
      </div>
    </div>
  `;

  return sendEmail({
    to: customer.email,
    subject: `🏁 [OTP: ${otp}] Return Verification for ${vehicleName} - #${booking.bookingid}`,
    html,
    text: `Hi ${customer.name},\n\nYour Return Verification OTP for ${vehicleName} is: ${otp}\nShare this code with your host to finalize your vehicle return.\n\nRentWheels Marketplace`
  });
};

/**
 * Helper: Late Return Penalty Notice
 */
const sendLateReturnPenaltyNotice = async (customer, booking, vehicle, penaltyAmount, hoursLate) => {
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model || ""}` : "Vehicle";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #fca5a5; border-radius: 16px; background-color: #fff;">
      <h2 style="color: #dc2626; margin-bottom: 6px;">⚠️ Late Return Penalty Applied</h2>
      <p>Hi <strong>${customer.name || "Customer"}</strong>,</p>
      <p style="color: #475569;">
        Your rental of <strong>${vehicleName}</strong> (Booking <strong>#${booking.bookingid}</strong>) was returned <strong>${hoursLate} hour(s)</strong> past the agreed return window.
      </p>

      <div style="background: #fef2f2; border: 1px solid #fee2e2; padding: 18px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 6px 0;"><strong>Scheduled Return:</strong> ${new Date(booking.endDate).toLocaleString()}</p>
        <p style="margin: 6px 0;"><strong>Actual Return:</strong> ${new Date().toLocaleString()}</p>
        <p style="margin: 6px 0;"><strong>Late Duration:</strong> ${hoursLate} hours</p>
        <p style="margin: 6px 0; color: #b91c1c; font-size: 16px;"><strong>Penalty Amount:</strong> ₹${penaltyAmount}</p>
      </div>

      <p style="color: #64748b; font-size: 13px;">This amount is adjusted against the security deposit / final settlement.</p>
    </div>
  `;

  return sendEmail({
    to: customer.email,
    subject: `⚠️ Late Return Notice - Booking #${booking.bookingid}`,
    html
  });
};

module.exports = {
  sendEmail,
  sendRegistrationOtpEmail,
  sendBookingConfirmation,
  sendNewBookingRequestToHost,
  sendBookingAcceptedToCustomer,
  sendBookingDeclinedToCustomer,
  sendVehicleHandoverToHost,
  sendVehicleReceivedToCustomer,
  sendReviewRequestEmail,
  sendReviewNotificationToHost,
  sendReviewConfirmationToCustomer,
  sendPaymentReceipt,
  sendPaymentReceiptToHost,
  sendCashPaymentReceipt,
  sendBookingStatusUpdate,
  sendLicenseStatusUpdate,
  sendHandoverOtpToCustomer,
  sendReturnOtpToCustomer,
  sendLateReturnPenaltyNotice,
  isSmtpConfigured,
};
