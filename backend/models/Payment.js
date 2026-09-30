
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentid: {
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

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "online"],
      required: true
    },

    transactionId: {
      type: String,
      trim: true,
      default: null
    },

    status: {
      type: String,
      enum: [
        "pending",
        "completed",
        "failed",
        "refunded"
      ],
      default: "pending"
    },

    refundAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    refundStatus: {
      type: String,
      enum: [
        "not_requested",
        "pending",
        "completed",
        "failed"
      ],
      default: "not_requested"
    },

    refundTransactionId: {
      type: String,
      trim: true,
      default: null
    },

    paidAt: {
      type: Date,
      default: null
    },

    refundedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.path("refundAmount").validate(function (value) {
  return value <= this.amount;
}, "Refund amount cannot exceed payment amount");

module.exports = mongoose.model("Payment", paymentSchema);

