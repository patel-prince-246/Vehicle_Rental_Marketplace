const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/User");
const Owner = require("./models/Owner");
const Agency = require("./models/Agency");
const Admin = require("./models/Admin");
const Vehicle = require("./models/Vehicle");
const Booking = require("./models/Booking");
const Payment = require("./models/Payment");
const Review = require("./models/Review");
const Notification = require("./models/Notification");
const EmailOTP = require("./models/EmailOTP");

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for clean reset...");

    // Clear all existing collections to remove all dummy data
    await User.deleteMany({});
    await Owner.deleteMany({});
    await Agency.deleteMany({});
    await Admin.deleteMany({});
    await Vehicle.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Review.deleteMany({});
    await Notification.deleteMany({});
    await EmailOTP.deleteMany({});

    console.log("Cleared all dummy collections (users, vehicles, bookings, etc.).");

    // Hash Admin password
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash("Tapan71.", salt);

    // Create the single Master Admin
    const adminUser = await User.create({
      userid: "USR-ADM-001",
      name: "Tapan Modi",
      email: "moditapan0@gmail.com",
      phone: "9327102008",
      password: adminPassword,
      city: "Nadiad",
      role: "admin",
      isActive: true,
    });

    await Admin.create({
      adminid: "ADM001",
      userId: adminUser._id,
      name: "Tapan Modi",
      email: "moditapan0@gmail.com",
      phone: "9327102008",
      isActive: true,
    });

    console.log("\n============================================");
    console.log("DATABASE RESET SUCCESSFUL!");
    console.log("All dummy data removed.");
    console.log("Master Platform Admin:");
    console.log("Email:    moditapan0@gmail.com");
    console.log("Password: Tapan71.");
    console.log("============================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Reset Error:", error);
    process.exit(1);
  }
};

seedDatabase();
