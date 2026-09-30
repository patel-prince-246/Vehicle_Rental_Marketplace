
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const Owner = require("../models/Owner");
const Agency = require("../models/Agency");

// Find the vehicle owner using the lowercase ownerType values.
const getVehicleOwner = async (vehicle) => {
  if (vehicle.ownerType === "owner") {
    return Owner.findById(vehicle.ownerId);
  }

  if (vehicle.ownerType === "agency") {
    return Agency.findById(vehicle.ownerId);
  }

  return null;
};

const hasVehicleAccess = async (vehicle, user) => {
  if (user.role === "admin") return true;

  const owner = await getVehicleOwner(vehicle);

  return (
    owner &&
    owner.userId &&
    owner.userId.toString() === user.id
  );
};

// Keep the vehicle status consistent with its bookings.
// Do not overwrite maintenance or unavailable status.
const refreshVehicleStatus = async (vehicleId) => {
  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) return;

  if (
    ["maintenance", "unavailable"].includes(vehicle.status)
  ) {
    return;
  }

  const ongoingBooking = await Booking.findOne({
    vehicleId,
    status: "ongoing"
  });

  vehicle.status = ongoingBooking ? "booked" : "available";
  await vehicle.save();
};

// ==============================
// CREATE BOOKING
// ==============================
const createBooking = async (req, res) => {
  try {
    const {
      bookingid,
      vehicleId,
      startDate,
      endDate,
      pickupLocation,
      returnLocation,
      securityDeposit
    } = req.body;

    if (!bookingid || !vehicleId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Booking ID, vehicle, start date and end date are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID"
      });
    }

    const customer = await User.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    if (customer.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can create bookings"
      });
    }

    if (customer.license?.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Your driving license was rejected. Please contact support."
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    if (vehicle.verificationStatus !== "verified") {
      return res.status(400).json({
        success: false,
        message: "Vehicle is not verified"
      });
    }

    if (["maintenance", "unavailable"].includes(vehicle.status)) {
      return res.status(400).json({
        success: false,
        message: "Vehicle is currently unavailable"
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking dates"
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date"
      });
    }

    if (start < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Booking start date cannot be in the past"
      });
    }

    const overlappingBooking = await Booking.findOne({
      vehicleId,
      status: { $in: ["pending", "confirmed", "ongoing"] },
      startDate: { $lt: end },
      endDate: { $gt: start }
    });

    if (overlappingBooking) {
      return res.status(409).json({
        success: false,
        message: "Vehicle is already booked for the selected dates"
      });
    }

    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const totalAmount = days * vehicle.pricePerDay;
    const deposit =
      securityDeposit === undefined ? 0 : Number(securityDeposit);

    if (!Number.isFinite(deposit) || deposit < 0) {
      return res.status(400).json({
        success: false,
        message: "Security deposit must be a valid non-negative number"
      });
    }

    const existingBooking = await Booking.findOne({ bookingid });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "Booking ID already exists"
      });
    }

    const booking = await Booking.create({
      bookingid,
      customerId: req.user.id,
      vehicleId,
      startDate: start,
      endDate: end,
      totalAmount,
      securityDeposit: deposit,
      pickupLocation,
      returnLocation,
      status: "pending",
      paymentStatus: "pending"
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking
    });
  } catch (error) {
    console.error("Create Booking Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ==============================
// GET ALL BOOKINGS (ADMIN)
// ==============================
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customerId", "-password")
      .populate("vehicleId");

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error("Get Bookings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ==============================
// GET MY BOOKINGS (CUSTOMER)
// ==============================
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      customerId: req.user.id
    })
      .populate("vehicleId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error("Get My Bookings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ==============================
// GET OWNER / AGENCY BOOKINGS
// ==============================
const getOwnerBookings = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      ownerType: req.user.role,
      ownerId: {
        $in: await (async () => {
          const Model = req.user.role === "owner" ? Owner : Agency;
          const profile = await Model.findOne({ userId: req.user.id });
          return profile ? [profile._id] : [];
        })()
      }
    }).select("_id");

    const vehicleIds = vehicles.map((vehicle) => vehicle._id);

    const bookings = await Booking.find({
      vehicleId: { $in: vehicleIds }
    })
      .populate("customerId", "-password")
      .populate("vehicleId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error("Get Owner Bookings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ==============================
// GET BOOKING BY ID
// ==============================
const getBookingById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID"
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate("customerId", "-password")
      .populate("vehicleId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const isCustomer =
      booking.customerId &&
      booking.customerId._id.toString() === req.user.id;

    const vehicle = booking.vehicleId;
    const isAdmin = req.user.role === "admin";
    const isOwner =
      vehicle && await hasVehicleAccess(vehicle, req.user);

    if (!isAdmin && !isCustomer && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You cannot view this booking"
      });
    }

    return res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error("Get Booking Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ==============================
// UPDATE BOOKING STATUS
// ==============================
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "ongoing",
      "returned",
      "cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID"
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const vehicle = await Vehicle.findById(booking.vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    const isAdmin = req.user.role === "admin";
    const hasAccess = await hasVehicleAccess(vehicle, req.user);

    if (!isAdmin && !hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this booking"
      });
    }

    const transitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["ongoing", "cancelled"],
      ongoing: ["returned"],
      returned: [],
      cancelled: []
    };

    if (!transitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change booking from ${booking.status} to ${status}`
      });
    }

    if (status === "ongoing" && booking.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Booking must be paid before it can start"
      });
    }

    if (status === "ongoing") {
      const now = new Date();

      if (now < booking.startDate || now >= booking.endDate) {
        return res.status(400).json({
          success: false,
          message: "Booking is outside its scheduled rental period"
        });
      }
    }

    booking.status = status;
    await booking.save();

    await refreshVehicleStatus(booking.vehicleId);

    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      booking
    });
  } catch (error) {
    console.error("Update Booking Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ==============================
// CANCEL BOOKING
// ==============================
const cancelBooking = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID"
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const isCustomer =
      booking.customerId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    const vehicle = await Vehicle.findById(booking.vehicleId);
    const isOwner =
      vehicle && await hasVehicleAccess(vehicle, req.user);

    if (!isCustomer && !isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You cannot cancel this booking"
      });
    }

    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Only pending or confirmed bookings can be cancelled"
      });
    }

    booking.status = "cancelled";

    // Do not mark a refund as completed here.
    // Refund processing is handled separately by paymentController.
    await booking.save();

    await refreshVehicleStatus(booking.vehicleId);

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
      refundMessage:
        booking.paymentStatus === "paid"
          ? "Payment was already completed. Request a refund through the payment API."
          : "No completed payment was found for this booking."
    });
  } catch (error) {
    console.error("Cancel Booking Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getMyBookings,
  getOwnerBookings,
  getBookingById,
  updateBooking: updateBookingStatus,
  updateBookingStatus,
  cancelBooking
};