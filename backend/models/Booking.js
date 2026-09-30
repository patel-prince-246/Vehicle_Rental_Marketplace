
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
      required: true,
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: "End date must be after start date"
      }
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

// Validate that the refund does not exceed the total
bookingSchema.path("refundAmount").validate(function (value) {
  return value <= this.totalAmount + this.securityDeposit;
}, "Refund amount cannot exceed the total amount and security deposit");

module.exports = mongoose.model("Booking", bookingSchema);