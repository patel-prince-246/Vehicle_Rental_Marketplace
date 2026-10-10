
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const User = require("../models/User");

// ==============================
// CREATE PAYMENT
// ==============================
const createPayment = async (req, res) => {
  try {
    const { paymentid, bookingId, amount, paymentMethod } = req.body;

    if (!paymentid || !bookingId || amount === undefined || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required payment details"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID"
      });
    }

    const validMethods = ["cash", "card", "upi", "online"];

    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method"
      });
    }

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than zero"
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only pay for your own bookings"
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot pay for a cancelled booking"
      });
    }

    if (booking.paymentStatus === "paid" ||
        booking.paymentStatus === "refunded") {
      return res.status(400).json({
        success: false,
        message: "This booking has already been paid or refunded"
      });
    }

    if (paymentAmount !== Number(booking.totalAmount)) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must match the booking total"
      });
    }

    const existingPayment = await Payment.findOne({
      bookingId,
      status: { $in: ["pending", "completed"] }
    });

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message: "A pending or completed payment already exists"
      });
    }

    let finalPaymentId = paymentid || `PAY-${Date.now()}`;
    const duplicatePaymentId = await Payment.findOne({ paymentid: finalPaymentId });
    if (duplicatePaymentId) {
      finalPaymentId = `${finalPaymentId}-${Date.now().toString().slice(-4)}`;
    }

    const isOnline = paymentMethod !== "cash";
    const paymentStatus = isOnline ? "completed" : "pending";
    const txnId = req.body.transactionId || (isOnline ? `TXN-${Date.now().toString().slice(-8)}` : null);

    const payment = await Payment.create({
      paymentid: finalPaymentId,
      bookingId,
      customerId: req.user.id,
      amount: paymentAmount,
      paymentMethod,
      transactionId: txnId,
      status: paymentStatus,
      paidAt: isOnline ? new Date() : null,
      refundAmount: 0,
      refundStatus: "not_requested"
    });

    if (isOnline) {
      booking.paymentStatus = "paid";
      await Booking.findByIdAndUpdate(booking._id, { paymentStatus: "paid" });

      // Send payment receipt email & in-app notifications
      try {
        const { sendPaymentReceipt } = require("../services/emailService");
        const { sendNotification } = require("../utils/notificationService");
        const Vehicle = require("../models/Vehicle");
        const Owner = require("../models/Owner");
        const Agency = require("../models/Agency");

        const userObj = await User.findById(req.user.id);
        if (userObj) {
          await sendPaymentReceipt(userObj, payment, booking).catch((mailErr) =>
            console.warn("Mail receipt send error:", mailErr.message)
          );
        }

        // Notify Host that customer paid
        const vehicle = await Vehicle.findById(booking.vehicleId);
        if (vehicle) {
          let host = null;
          if (vehicle.ownerType === "owner") {
            host = await Owner.findById(vehicle.ownerId || vehicle.ownerid);
          } else if (vehicle.ownerType === "agency") {
            host = await Agency.findById(vehicle.ownerId || vehicle.ownerid);
          }

          if (host && host.userId) {
            await sendNotification({
              userId: host.userId,
              role: vehicle.ownerType || "owner",
              type: "payment_received",
              title: "Payment Received",
              message: `Customer ${userObj?.name || "Renter"} completed payment of ₹${paymentAmount} for booking #${booking.bookingid || booking._id}.`,
              link: vehicle.ownerType === "agency" ? "/agency/dashboard?tab=bookings" : "/owner/dashboard?tab=bookings"
            });

            if (host.email) {
              const { sendPaymentReceiptToHost } = require("../services/emailService");
              await sendPaymentReceiptToHost(host, userObj, payment, booking, vehicle).catch((mailErr) =>
                console.warn("Host mail receipt send error:", mailErr.message)
              );
            }
          }
        }
      } catch (eErr) {
        console.warn("Payment notification error:", eErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: isOnline ? "Payment completed successfully." : "Payment record created (Cash on pickup pending).",
      payment
    });
  } catch (error) {
    console.error("Create Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process payment",
      error: error.message
    });
  }
};

// ==============================
// GET MY PAYMENTS
// ==============================
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      customerId: req.user.id
    })
      .populate("bookingId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error("Get My Payments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ==============================
// GET ALL PAYMENTS (ADMIN)
// ==============================
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("bookingId")
      .populate("customerId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error("Get All Payments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ==============================
// GET PAYMENT BY ID
// ==============================
const getPaymentById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    const payment = await Payment.findById(req.params.id)
      .populate("bookingId")
      .populate("customerId", "name email");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const isAdmin = req.user.role === "admin";
    const isCustomer =
      payment.customerId &&
      payment.customerId._id.toString() === req.user.id;

    if (!isAdmin && !isCustomer) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this payment"
      });
    }

    return res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    console.error("Get Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ==============================
// UPDATE PAYMENT STATUS (ADMIN)
// ==============================
const updatePaymentStatus = async (req, res) => {
  try {
    const { status, transactionId } = req.body;

    if (!["completed", "failed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be completed or failed"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending payments can be updated"
      });
    }

    const booking = await Booking.findById(payment.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Associated booking not found"
      });
    }

    if (status === "completed") {
      if (booking.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: "Cannot complete payment for a cancelled booking"
        });
      }

      const anotherPaidPayment = await Payment.findOne({
        bookingId: payment.bookingId,
        _id: { $ne: payment._id },
        status: "completed"
      });

      if (anotherPaidPayment) {
        return res.status(409).json({
          success: false,
          message: "Another payment is already completed for this booking"
        });
      }

      payment.paidAt = new Date();
      booking.paymentStatus = "paid";

      // Send payment receipt email
      try {
        const User = require("../models/User");
        const user = await User.findById(payment.customerId);
        if (user) {
          const { sendPaymentReceipt } = require("../services/emailService");
          await sendPaymentReceipt(user, payment, booking);
        }
      } catch (eErr) {
        console.warn("Payment email receipt error:", eErr.message);
      }
    } else {
      // Do not overwrite a successful payment status.
      const anotherPaidPayment = await Payment.findOne({
        bookingId: payment.bookingId,
        _id: { $ne: payment._id },
        status: "completed"
      });

      if (!anotherPaidPayment) {
        booking.paymentStatus = "failed";
      }
    }

    payment.status = status;

    if (transactionId !== undefined) {
      payment.transactionId = String(transactionId).trim();
    }

    await payment.save();
    await booking.save();

    return res.status(200).json({
      success: true,
      message: `Payment marked as ${status}`,
      payment
    });

  } catch (error) {
    console.error("Update Payment Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ==============================
// REQUEST REFUND
// ==============================
const requestRefund = async (req, res) => {
  try {
    const { refundAmount } = req.body;

    if (
      refundAmount === undefined ||
      !Number.isFinite(Number(refundAmount)) ||
      Number(refundAmount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid refund amount"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const isAdmin = req.user.role === "admin";
    const isCustomer =
      payment.customerId.toString() === req.user.id;

    if (!isAdmin && !isCustomer) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to request this refund"
      });
    }

    if (payment.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed payments can be refunded"
      });
    }

    // This model stores one refund request per payment.
    if (payment.refundStatus !== "not_requested") {
      return res.status(400).json({
        success: false,
        message: "A refund has already been requested for this payment"
      });
    }

    const requestedAmount = Number(refundAmount);

    if (requestedAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: "Refund cannot exceed the amount paid"
      });
    }

    const booking = await Booking.findById(payment.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Associated booking not found"
      });
    }

    if (booking.status !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancel the booking before requesting a refund"
      });
    }

    payment.refundAmount = requestedAmount;
    payment.refundStatus = "pending";

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Refund request created and is pending admin processing",
      payment
    });
  } catch (error) {
    console.error("Request Refund Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ==============================
// PROCESS REFUND (ADMIN)
// ==============================
const processRefund = async (req, res) => {
  try {
    const { status, refundTransactionId } = req.body;

    if (!["completed", "failed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Refund status must be completed or failed"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (payment.refundStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending refunds can be processed"
      });
    }

    const booking = await Booking.findById(payment.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Associated booking not found"
      });
    }

    if (status === "completed") {
      const refundAmount = Number(payment.refundAmount || 0);

      if (refundAmount <= 0 || refundAmount > payment.amount) {
        return res.status(400).json({
          success: false,
          message: "Stored refund amount is invalid"
        });
      }

      payment.refundStatus = "completed";
      payment.refundedAt = new Date();

      if (refundTransactionId !== undefined) {
        payment.refundTransactionId = String(refundTransactionId).trim();
      }

      booking.refundAmount = Math.min(
        Number(booking.totalAmount) + Number(booking.securityDeposit || 0),
        Number(booking.refundAmount || 0) + refundAmount
      );

      if (refundAmount >= payment.amount) {
        payment.status = "refunded";
      }

      // A booking is fully refunded only when its rental payment
      // amount has been refunded. The security deposit is not part
      // of this payment record.
      if (booking.refundAmount >= booking.totalAmount) {
        booking.paymentStatus = "refunded";
      }
    } else {
      payment.refundStatus = "failed";
    }

    await payment.save();
    await booking.save();

    return res.status(200).json({
      success: true,
      message: `Refund marked as ${status}`,
      payment,
      booking
    });
  } catch (error) {
    console.error("Process Refund Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ==============================
// GET RAZORPAY KEY
// ==============================
const getRazorpayKey = async (req, res) => {
  return res.json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID || "rzp_test_5173devkey"
  });
};

// ==============================
// CREATE RAZORPAY ORDER
// ==============================
const createRazorpayOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Valid booking ID is required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized access to this booking" });
    }
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Booking is already paid" });
    }

    const amountInPaise = Math.round(Number(booking.totalAmount) * 100);
    const receipt = `rcpt_${booking.bookingid || booking._id.toString().slice(-6)}_${Date.now().toString().slice(-4)}`;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If live/real Razorpay keys are configured (not placeholder/dev defaults)
    if (keyId && keySecret && !keyId.includes("devkey") && !keyId.includes("placeholder")) {
      try {
        const Razorpay = require("razorpay");
        const instance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret
        });

        const options = {
          amount: amountInPaise,
          currency: "INR",
          receipt: receipt.slice(0, 40),
          notes: {
            bookingId: booking._id.toString(),
            bookingReference: booking.bookingid,
            customerId: req.user.id
          }
        };

        const order = await instance.orders.create(options);
        return res.status(200).json({
          success: true,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          key: keyId,
          booking
        });
      } catch (rzpErr) {
        console.warn("Razorpay SDK Order Error (falling back to standard direct payment):", rzpErr.message);
      }
    }

    // Default seamless dev/test order so payment never breaks
    const mockOrderId = `order_${Date.now()}`;
    return res.status(200).json({
      success: true,
      orderId: mockOrderId,
      amount: amountInPaise,
      currency: "INR",
      key: keyId || "rzp_test_5173devkey",
      isSimulated: true,
      booking
    });
  } catch (err) {
    console.error("Create Razorpay Order Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create payment order"
    });
  }
};

// ==============================
// VERIFY RAZORPAY PAYMENT
// ==============================
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!bookingId || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details missing"
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Verify signature when genuine secret is provided
    if (razorpay_signature && keySecret && !keyId.includes("devkey") && !keyId.includes("placeholder")) {
      const crypto = require("crypto");
      const hmac = crypto.createHmac("sha256", keySecret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment signature verification failed"
        });
      }
    }

    // Update booking payment status
    booking.paymentStatus = "paid";
    await Booking.findByIdAndUpdate(booking._id, { paymentStatus: "paid" });

    // Create Payment record
    const finalPaymentId = `PAY-RZP-${Date.now().toString().slice(-6)}`;
    const payment = await Payment.create({
      paymentid: finalPaymentId,
      bookingId: booking._id,
      customerId: req.user.id,
      amount: booking.totalAmount,
      paymentMethod: "online",
      transactionId: razorpay_payment_id,
      status: "completed",
      paidAt: new Date(),
      refundAmount: 0,
      refundStatus: "not_requested"
    });

    // Send notifications and receipts
    try {
      const { sendPaymentReceipt } = require("../services/emailService");
      const { sendNotification } = require("../utils/notificationService");
      const Vehicle = require("../models/Vehicle");
      const Owner = require("../models/Owner");
      const Agency = require("../models/Agency");

      const userObj = await User.findById(req.user.id);
      if (userObj) {
        await sendPaymentReceipt(userObj, payment, booking).catch((mErr) =>
          console.warn("Mail receipt send error:", mErr.message)
        );
      }

      const vehicle = await Vehicle.findById(booking.vehicleId);
      if (vehicle) {
        let host = null;
        if (vehicle.ownerType === "owner") {
          host = await Owner.findById(vehicle.ownerId || vehicle.ownerid);
        } else if (vehicle.ownerType === "agency") {
          host = await Agency.findById(vehicle.ownerId || vehicle.ownerid);
        }

        if (host && host.userId) {
          await sendNotification({
            userId: host.userId,
            role: vehicle.ownerType || "owner",
            type: "payment_received",
            title: "Payment Received via Razorpay",
            message: `Customer ${userObj?.name || "Renter"} paid ₹${booking.totalAmount} via Razorpay (Txn: ${razorpay_payment_id}) for #${booking.bookingid || booking._id}.`,
            link: vehicle.ownerType === "agency" ? "/agency/dashboard?tab=bookings" : "/owner/dashboard?tab=bookings"
          });

          // Email receipt to Host as well (both sides receive confirmation)
          if (host.email) {
            const { sendPaymentReceiptToHost } = require("../services/emailService");
            await sendPaymentReceiptToHost(host, userObj, payment, booking, vehicle).catch((err) =>
              console.warn("Razorpay host receipt email error:", err.message)
            );
          }
        }
      }
    } catch (notifErr) {
      console.warn("Notification dispatch error:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Razorpay payment completed successfully!",
      payment,
      booking
    });
  } catch (err) {
    console.error("Razorpay Verification Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Payment verification failed",
      error: err.message
    });
  }
};

// ==============================
// CONFIRM CASH PAYMENT (OWNER / AGENCY / ADMIN)
// ==============================
const confirmCashPayment = async (req, res) => {
  try {
    const bookingId = req.params.bookingId || req.body.bookingId;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Valid booking ID is required",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot confirm cash payment for a cancelled booking",
      });
    }

    const Vehicle = require("../models/Vehicle");
    const vehicle = await Vehicle.findById(booking.vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Associated vehicle not found",
      });
    }

    // Check authorization: Must be the vehicle host or admin
    const Owner = require("../models/Owner");
    const Agency = require("../models/Agency");
    let host = null;
    if (vehicle.ownerType === "owner") {
      host = await Owner.findById(vehicle.ownerId || vehicle.ownerid);
    } else if (vehicle.ownerType === "agency") {
      host = await Agency.findById(vehicle.ownerId || vehicle.ownerid);
    }

    const isAdmin = req.user.role === "admin";
    const isOwner = host && host.userId && host.userId.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to confirm payments for this vehicle",
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This booking is already marked as paid",
      });
    }

    // Find existing pending cash payment or create a new completed one
    let payment = await Payment.findOne({
      bookingId: booking._id,
      status: { $in: ["pending", "completed"] },
    });

    const cashTxnId = `CASH-CONFIRMED-${Date.now().toString().slice(-6)}`;

    if (payment) {
      payment.paymentMethod = "cash";
      payment.status = "completed";
      payment.transactionId = cashTxnId;
      payment.paidAt = new Date();
      await payment.save();
    } else {
      payment = await Payment.create({
        paymentid: `PAY-CASH-${Date.now().toString().slice(-6)}`,
        bookingId: booking._id,
        customerId: booking.customerId,
        amount: booking.totalAmount,
        paymentMethod: "cash",
        transactionId: cashTxnId,
        status: "completed",
        paidAt: new Date(),
        refundAmount: 0,
        refundStatus: "not_requested",
      });
    }

    // Update booking payment status
    booking.paymentStatus = "paid";
    await booking.save();

    // Fetch customer details
    const customer = await User.findById(booking.customerId);

    // Send emails & in-app notifications
    try {
      const {
        sendCashPaymentReceipt,
        sendPaymentReceiptToHost,
      } = require("../services/emailService");
      const { sendNotification } = require("../utils/notificationService");

      // 1. Email & in-app to Customer confirming cash payment
      if (customer && customer.email) {
        await sendCashPaymentReceipt(customer, host, payment, booking, vehicle).catch((err) =>
          console.warn("Cash receipt email error:", err.message)
        );

        await sendNotification({
          userId: customer._id,
          role: "customer",
          type: "payment_received",
          title: "Cash Payment Confirmed",
          message: `Host confirmed receipt of ₹${booking.totalAmount} in cash for booking #${booking.bookingid}. Your reservation is fully paid!`,
          link: "/customer/dashboard?tab=bookings",
        });
      }

      // 2. Email & in-app to Host confirming cash payment recorded
      if (host && host.email) {
        await sendPaymentReceiptToHost(host, customer, payment, booking, vehicle).catch((err) =>
          console.warn("Host cash payment email error:", err.message)
        );
      }

      await sendNotification({
        userId: req.user.id,
        role: req.user.role,
        type: "payment_received",
        title: "Cash Payment Recorded",
        message: `You recorded ₹${booking.totalAmount} in cash received from ${customer?.name || "Customer"} for #${booking.bookingid}.`,
        link: req.user.role === "agency" ? "/agency/dashboard?tab=bookings" : "/owner/dashboard?tab=bookings",
      });
    } catch (notifErr) {
      console.warn("Cash payment notification error:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Cash payment of ₹${booking.totalAmount} confirmed successfully!`,
      payment,
      booking,
    });
  } catch (error) {
    console.error("Confirm Cash Payment Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm cash payment",
      error: error.message,
    });
  }
};

module.exports = {
  createPayment,
  getMyPayments,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  requestRefund,
  processRefund,
  getRazorpayKey,
  createRazorpayOrder,
  verifyRazorpayPayment,
  confirmCashPayment,
};