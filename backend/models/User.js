const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
userid: {
  type: String,
  trim: true
},

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    city: {
      type: String,
      required: true,
      trim: true
    },

    role: {
      type: String,
      enum: ["customer", "owner", "agency", "admin"],
      default: "customer"
    },

    license: {
      licenseNumber: {
        type: String,
        trim: true
      },

      imageUrl: {
        type: String
      },

      status: {
        type: String,
        enum: [
          "not_uploaded",
          "uploaded",
          "verified",
          "rejected"
        ],
        default: "not_uploaded"
      }
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);