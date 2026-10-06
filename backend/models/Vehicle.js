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
      default: "owner"
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "ownerType"
    },

    // Backward compatibility for legacy vehicles created with ownerid
    ownerid: {
      type: mongoose.Schema.Types.ObjectId
    },

    brand: {
      type: String,
      required: true,
      trim: true
    },

    model: {
      type: String,
      default: "",
      trim: true
    },

    type: {
      type: String,
      enum: ["Bike", "Car", "Scooter", "SUV", "Luxury", "Van", "Other"],
      required: true
    },


    // Backward compatibility for legacy vehicles created with price
    price: {
      type: Number
    },

    pricePerDay: {
      type: Number,
      min: 0
    },

    city: {
      type: String,
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
        "maintenance",
        "inactive"
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