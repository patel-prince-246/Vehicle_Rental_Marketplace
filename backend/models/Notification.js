const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    role: {
      type: String,
      enum: ["customer", "owner", "agency", "admin", "all"],
      default: "customer"
    },

    type: {
      type: String,
      default: "system",
      trim: true
    },

    title: {
      type: String,
      trim: true,
      default: "Notification"
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    link: {
      type: String,
      trim: true,
      default: ""
    },

    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);