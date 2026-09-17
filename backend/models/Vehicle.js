const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    vehicleid: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    ownerType: {
      type: String,
      enum: ["owner", "agency"],
      required: true
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "ownerType"
    },

    brand: {
      type: String,
      required: true,
      trim: true
    },

    model: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ["Bike", "Car", "Scooter", "SUV", "Other"],
      required: true
    },

    pricePerDay: {
      type: Number,
      required: true,
      min: 0
    },

    city: {
      type: String,
      required: true,
      trim: true
    },

    year: {
      type: Number,
      required: true
    },

    registrationNumber: {
      type: String,
      trim: true
    },

    status: {
      type: String,
      enum: [
        "available",
        "booked",
        "unavailable",
        "maintenance"
      ],
      default: "available"
    },

    verificationStatus: {
      type: String,
      enum: [
        "pending",
        "verified",
        "rejected"
      ],
      default: "pending"
    },

    imageUrl: {
      type: String
    },

    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);