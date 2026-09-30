const User = require("../models/User");
const Owner = require("../models/Owner");
const Agency = require("../models/Agency");
const Vehicle = require("../models/Vehicle");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Review = require("../models/Review");


// ==============================
// GET ALL USERS
// ==============================
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {
    console.error("Get All Users Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET USER BY ID
// ==============================
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error("Get User Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// UPDATE USER STATUS
// ==============================
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      {
        new: true,
        runValidators: true
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      user
    });

  } catch (error) {
    console.error("Update User Status Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// DELETE USER
// ==============================
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await User.findByIdAndDelete(
      req.params.id
    );

    // Delete linked Owner profile
    await Owner.deleteOne({
      userId: req.params.id
    });

    // Delete linked Agency profile
    await Agency.deleteOne({
      userId: req.params.id
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error("Delete User Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET ALL OWNERS
// ==============================
const getAllOwners = async (req, res) => {
  try {
    const owners = await Owner.find()
      .populate("userId", "-password");

    res.status(200).json({
      success: true,
      count: owners.length,
      owners
    });

  } catch (error) {
    console.error("Get All Owners Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET ALL AGENCIES
// ==============================
const getAllAgencies = async (req, res) => {
  try {
    const agencies = await Agency.find()
      .populate("userId", "-password");

    res.status(200).json({
      success: true,
      count: agencies.length,
      agencies
    });

  } catch (error) {
    console.error("Get All Agencies Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// VERIFY OWNER
// ==============================
const verifyOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(
      req.params.id
    );

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found"
      });
    }

    owner.isVerified = true;

    await owner.save();

    res.status(200).json({
      success: true,
      message: "Owner verified successfully",
      owner
    });

  } catch (error) {
    console.error("Verify Owner Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// VERIFY AGENCY
// ==============================
const verifyAgency = async (req, res) => {
  try {
    const agency = await Agency.findById(
      req.params.id
    );

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found"
      });
    }

    agency.isVerified = true;

    await agency.save();

    res.status(200).json({
      success: true,
      message: "Agency verified successfully",
      agency
    });

  } catch (error) {
    console.error("Verify Agency Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// VERIFY VEHICLE
// ==============================
const verifyVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(
      req.params.id
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    vehicle.verificationStatus = "verified";

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Vehicle verified successfully",
      vehicle
    });

  } catch (error) {
    console.error("Verify Vehicle Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// REJECT VEHICLE
// ==============================
const rejectVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(
      req.params.id
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    vehicle.verificationStatus = "rejected";

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Vehicle verification rejected",
      vehicle
    });

  } catch (error) {
    console.error("Reject Vehicle Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET ALL VEHICLES
// ==============================
const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles
    });

  } catch (error) {
    console.error("Admin Get Vehicles Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET ALL BOOKINGS
// ==============================
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customerId", "-password")
      .populate("vehicleId");

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });

  } catch (error) {
    console.error("Admin Get Bookings Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET ALL PAYMENTS
// ==============================
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("bookingId")
      .populate("customerId", "-password");

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });

  } catch (error) {
    console.error("Admin Get Payments Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET ALL REVIEWS
// ==============================
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("customerId", "-password")
      .populate("vehicleId")
      .populate("bookingId");

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });

  } catch (error) {
    console.error("Admin Get Reviews Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// DASHBOARD STATISTICS
// ==============================
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalOwners,
      totalAgencies,
      totalVehicles,
      totalBookings,
      totalPayments,
      totalReviews
    ] = await Promise.all([
      User.countDocuments(),
      Owner.countDocuments(),
      Agency.countDocuments(),
      Vehicle.countDocuments(),
      Booking.countDocuments(),
      Payment.countDocuments(),
      Review.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        totalUsers,
        totalOwners,
        totalAgencies,
        totalVehicles,
        totalBookings,
        totalPayments,
        totalReviews
      }
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET ALL LICENSES / PENDING QUEUE
// ==============================
const getAllLicenses = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { "license.status": { $ne: "not_uploaded" } };
    if (status) {
      filter["license.status"] = status;
    }

    const users = await User.find(filter)
      .select("name email phone city role license createdAt")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      licenses: users,
    });
  } catch (error) {
    console.error("Get Licenses Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// ==============================
// VERIFY LICENSE
// ==============================
const verifyLicense = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.license.status = "verified";
    await user.save();

    // Create notification
    try {
      const Notification = require("../models/Notification");
      await Notification.create({
        userId: user._id,
        type: "license_verified",
        message: "Congratulations! Your driving license has been approved by the admin.",
      });
    } catch (nErr) {
      console.warn("Notification error:", nErr.message);
    }

    // Send email notification
    try {
      const { sendLicenseStatusUpdate } = require("../services/emailService");
      await sendLicenseStatusUpdate(user, "verified");
    } catch (eErr) {
      console.warn("Email error:", eErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Driving license verified successfully",
      license: user.license,
    });
  } catch (error) {
    console.error("Verify License Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// ==============================
// REJECT LICENSE
// ==============================
const rejectLicense = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.license.status = "rejected";
    await user.save();

    // Create notification
    try {
      const Notification = require("../models/Notification");
      await Notification.create({
        userId: user._id,
        type: "license_rejected",
        message: `Your driving license was rejected. Reason: ${reason || "Document details could not be validated."}`,
      });
    } catch (nErr) {
      console.warn("Notification error:", nErr.message);
    }

    // Send email notification
    try {
      const { sendLicenseStatusUpdate } = require("../services/emailService");
      await sendLicenseStatusUpdate(user, "rejected", reason);
    } catch (eErr) {
      console.warn("Email error:", eErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Driving license rejected",
      license: user.license,
    });
  } catch (error) {
    console.error("Reject License Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,

  getAllOwners,
  getAllAgencies,

  verifyOwner,
  verifyAgency,

  getAllVehicles,
  verifyVehicle,
  rejectVehicle,

  getAllBookings,
  getAllPayments,
  getAllReviews,

  getAllLicenses,
  verifyLicense,
  rejectLicense,

  getDashboardStats
};