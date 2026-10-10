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
      trim: true,
      default: ""
    },

    password: {
      type: String,
      required: function() {
        return this.authProvider !== "google";
      }
    },

    city: {
      type: String,
      trim: true,
      default: "Vadodara"
    },

    role: {
      type: String,
      enum: ["customer", "owner", "agency", "admin"],
      default: "customer"
    },

    googleId: {
      type: String,
      trim: true
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },

    isPhoneVerified: {
      type: Boolean,
      default: false
    },

    address: {
      type: String,
      trim: true,
      default: ""
    },

    avatar: {
      type: String,
      default: ""
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
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [72.8311, 21.1702]
      }
    },

    latitude: {
      type: Number,
      default: 21.1702
    },

    longitude: {
      type: Number,
      default: 72.8311
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);