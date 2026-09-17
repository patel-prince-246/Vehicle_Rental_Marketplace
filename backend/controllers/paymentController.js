const Payment = require("../models/Payment");
const Booking = require("../models/Booking");


// ==============================
// CREATE PAYMENT
// ==============================
const createPayment = async (req, res) => {
  try {
    const {
      paymentId,
      bookingId,
      amount,
      securityDeposit,
      paymentMethod
    } = req.body;

    if (
      !paymentId ||
      !bookingId ||
      amount === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment ID, booking ID and amount are required"
      });
    }

    const booking = await Booking.findById(
      bookingId
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (
      booking.customerId.toString() !==
      req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can pay only for your own booking"
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Booking is already paid"
      });
    }

    const payment = await Payment.create({
      paymentId,
      bookingId,
      customerId: req.user.id,
      amount,
      securityDeposit:
        securityDeposit || 0,
      paymentMethod:
        paymentMethod || "mock",
      status: "successful",
      transactionId:
        `TXN-${Date.now()}`
    });

    booking.paymentStatus = "paid";
    booking.status = "confirmed";

    await booking.save();

    res.status(201).json({
      success: true,
      message: "Payment successful",
      payment,
      booking
    });

  } catch (error) {
    console.error("Create Payment Error:", error);

    res.status(500).json({
      success: false,
      message: "Payment processing failed",
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
      .populate("bookingId");

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });

  } catch (error) {
    console.error("Get My Payments Error:", error);

    res.status(500).json({
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
    const payment = await Payment.findById(
      req.params.id
    )
      .populate("bookingId")
      .populate("customerId", "-password");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (
      payment.customerId._id.toString() !==
        req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    res.status(200).json({
      success: true,
      payment
    });

  } catch (error) {
    console.error("Get Payment Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// REFUND PAYMENT
// ==============================
const refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(
      req.params.id
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const booking = await Booking.findById(
      payment.bookingId
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const refundAmount =
      booking.refundAmount;

    payment.refundAmount =
      refundAmount;

    payment.status = "refunded";

    await payment.save();

    booking.paymentStatus = "refunded";

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Payment refunded successfully",
      refundAmount,
      payment
    });

  } catch (error) {
    console.error("Refund Payment Error:", error);

    res.status(500).json({
      success: false,
      message: "Refund failed",
      error: error.message
    });
  }
};


// ==============================
// GET ALL PAYMENTS
// ==============================
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("bookingId")
      .populate("customerId", "-password");

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });

  } catch (error) {
    console.error("Get All Payments Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


module.exports = {
  createPayment,
  getMyPayments,
  getPaymentById,
  refundPayment,
  getAllPayments
};