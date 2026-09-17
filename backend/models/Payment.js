const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    securityDeposit: {
      type: Number,
      default: 0,
      min: 0
    },

    refundAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    paymentMethod: {
      type: String,
      enum: [
        "mock",
        "razorpay",
        "cash"
      ],
      default: "mock"
    },

    status: {
      type: String,
      enum: [
        "pending",
        "successful",
        "failed",
        "refunded"
      ],
      default: "pending"
    },

    transactionId: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Payment", paymentSchema);