const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");


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

    if (
      !bookingid ||
      !vehicleId ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking ID, vehicle, start date and end date are required"
      });
    }

    const customer = await User.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Customer must have verified license
    if (
      customer.license.status !== "verified"
    ) {
      return res.status(400).json({
        success: false,
        message: "Verified driving license is required before booking"
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

    if (
      vehicle.status === "maintenance" ||
      vehicle.status === "unavailable"
    ) {
      return res.status(400).json({
        success: false,
        message: "Vehicle is currently unavailable"
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      isNaN(start.getTime()) ||
      isNaN(end.getTime())
    ) {
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

    // Prevent overlapping bookings
    const overlappingBooking = await Booking.findOne({
      vehicleId,
      status: {
        $in: [
          "pending",
          "confirmed",
          "ongoing"
        ]
      },
      startDate: {
        $lt: end
      },
      endDate: {
        $gt: start
      }
    });

    if (overlappingBooking) {
      return res.status(409).json({
        success: false,
        message: "Vehicle is already booked for the selected dates"
      });
    }

    // Calculate number of days
    const millisecondsPerDay =
      1000 * 60 * 60 * 24;

    const days = Math.ceil(
      (end - start) / millisecondsPerDay
    );

    const totalAmount =
      days * vehicle.pricePerDay;

    const deposit =
      securityDeposit !== undefined
        ? Number(securityDeposit)
        : 0;

    if (deposit < 0) {
      return res.status(400).json({
        success: false,
        message: "Security deposit cannot be negative"
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
      returnLocation
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking
    });

  } catch (error) {
    console.error("Create Booking Error:", error);

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
    console.error("Get Bookings Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET MY BOOKINGS
// ==============================
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      customerId: req.user.id
    })
      .populate("vehicleId")
      .populate("customerId", "-password");

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });

  } catch (error) {
    console.error("Get My Bookings Error:", error);

    res.status(500).json({
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
    const booking = await Booking.findById(
      req.params.id
    )
      .populate("customerId", "-password")
      .populate("vehicleId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    res.status(200).json({
      success: true,
      booking
    });

  } catch (error) {
    console.error("Get Booking Error:", error);

    res.status(500).json({
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

    const booking = await Booking.findById(
      req.params.id
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    booking.status = status;

    await booking.save();

    // Update vehicle status
    if (status === "ongoing") {
      await Vehicle.findByIdAndUpdate(
        booking.vehicleId,
        { status: "booked" }
      );
    }

    if (
      status === "returned" ||
      status === "cancelled"
    ) {
      await Vehicle.findByIdAndUpdate(
        booking.vehicleId,
        { status: "available" }
      );
    }

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      booking
    });

  } catch (error) {
    console.error("Update Booking Status Error:", error);

    res.status(500).json({
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
    const booking = await Booking.findById(
      req.params.id
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (
      booking.customerId.toString() !==
        req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot cancel this booking"
      });
    }

    if (
      ["returned", "cancelled"].includes(
        booking.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking cannot be cancelled"
      });
    }

    const now = new Date();

    let refundAmount = 0;

    // Simple cancellation/refund logic
    if (now < booking.startDate) {
      refundAmount = booking.totalAmount;
    } else if (now < booking.endDate) {
      refundAmount =
        Math.floor(
          booking.totalAmount * 0.5
        );
    }

    booking.status = "cancelled";
    booking.refundAmount = refundAmount;
    booking.paymentStatus =
      refundAmount > 0
        ? "refunded"
        : booking.paymentStatus;

    await booking.save();

    await Vehicle.findByIdAndUpdate(
      booking.vehicleId,
      { status: "available" }
    );

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      refundAmount,
      booking
    });

  } catch (error) {
    console.error("Cancel Booking Error:", error);

    res.status(500).json({
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
  getBookingById,
  updateBookingStatus,
  cancelBooking
};