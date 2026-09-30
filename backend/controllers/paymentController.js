
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");

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

    const duplicatePaymentId = await Payment.findOne({ paymentid });

    if (duplicatePaymentId) {
      return res.status(409).json({
        success: false,
        message: "Payment ID already exists"
      });
    }

    const payment = await Payment.create({
      paymentid,
      bookingId,
      customerId: req.user.id,
      amount: paymentAmount,
      paymentMethod,
      status: "pending",
      refundAmount: 0,
      refundStatus: "not_requested"
    });

    return res.status(201).json({
      success: true,
      message: "Payment record created. Payment is still pending.",
      payment
    });
  } catch (error) {
    console.error("Create Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
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

module.exports = {
  createPayment,
  getMyPayments,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  requestRefund,
  processRefund
};