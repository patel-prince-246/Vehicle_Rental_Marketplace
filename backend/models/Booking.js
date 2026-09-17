const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingid: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    totalAmount: {
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

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "ongoing",
        "returned",
        "cancelled"
      ],
      default: "pending"
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "refunded",
        "failed"
      ],
      default: "pending"
    },

    pickupLocation: {
      type: String,
      trim: true
    },

    returnLocation: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Booking", bookingSchema);