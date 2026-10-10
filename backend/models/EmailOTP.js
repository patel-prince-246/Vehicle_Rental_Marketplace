const mongoose = require("mongoose");

const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ["email", "sms", "whatsapp"],
      default: "email",
    },
    otp: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      enum: ["registration", "password_reset", "login", "vehicle_handover", "vehicle_return"],
      default: "registration",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: "0s" }, // Automatic cleanup by MongoDB when expiresAt is reached
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("EmailOTP", emailOtpSchema);
