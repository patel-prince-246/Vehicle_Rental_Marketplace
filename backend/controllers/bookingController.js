
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const Owner = require("../models/Owner");
const Agency = require("../models/Agency");
const Payment = require("../models/Payment");

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

    // SRS 3.1.3.6 & 3.2.10: Check Consumer Details (License Verification Gate)
    if (!customer.license || customer.license.status === "not_uploaded") {
      return res.status(400).json({
        success: false,
        requiresLicense: true,
        message: "A valid driving license is required to make a booking. Please upload your driving license first."
      });
    }

    if (customer.license.status === "rejected") {
      return res.status(400).json({
        success: false,
        requiresLicense: true,
        message: "Your driving license was rejected by the administrator. Please upload a valid document to proceed."
      });
    }

    if (customer.license.status !== "verified") {
      return res.status(400).json({
        success: false,
        requiresLicense: true,
        message: "Your driving license is currently pending administrator verification. You will be able to book vehicles once approved."
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

    // Send email confirmation & in-app notifications
    try {
      const { sendBookingConfirmation } = require("../services/emailService");
      await sendBookingConfirmation(customer, booking, vehicle);
    } catch (eErr) {
      console.warn("Booking confirmation email error:", eErr.message);
    }

    try {
      const { sendNotification, sendRoleNotification } = require("../utils/notificationService");

      // 1. Customer notification
      await sendNotification({
        userId: customer._id,
        role: "customer",
        type: "booking_request",
        title: "Booking Request Sent",
        message: `Your booking request #${bookingid} for ${vehicle.brand} ${vehicle.model} was sent. Waiting for host confirmation.`,
        link: `/customer/dashboard?tab=bookings&bookingId=${bookingid}`
      });

      // 2. Owner / Agency notification (Clicking directly opens the incoming booking)
      const owner = await getVehicleOwner(vehicle);
      if (owner && owner.userId) {
        const ownerDashboardLink = vehicle.ownerType === "agency"
          ? `/agency/dashboard?tab=bookings&bookingId=${bookingid}`
          : `/owner/dashboard?tab=bookings&bookingId=${bookingid}`;

        await sendNotification({
          userId: owner.userId,
          role: vehicle.ownerType || "owner",
          type: "booking_request",
          title: "New Booking Request",
          message: `Customer ${customer.name} requested to book your ${vehicle.brand} ${vehicle.model} (#${bookingid}). Click to review and confirm.`,
          link: ownerDashboardLink
        });
      }

      // 3. Admin notification
      await sendRoleNotification("admin", {
        type: "booking_created",
        title: "New Booking Request Placed",
        message: `Customer ${customer.name} placed booking request #${bookingid} for ₹${totalAmount}.`,
        link: `/admin/dashboard?tab=bookings&bookingId=${bookingid}`
      });
    } catch (nErr) {
      console.warn("In-app notification creation error:", nErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Booking request created successfully. Waiting for owner confirmation.",
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
    let ownerProfile = null;
    if (req.user.role === "owner") {
      ownerProfile = await Owner.findOne({ userId: req.user.id });
    } else if (req.user.role === "agency") {
      ownerProfile = await Agency.findOne({ userId: req.user.id });
    }

    if (!ownerProfile) {
      return res.status(404).json({
        success: false,
        message: "Host profile not found"
      });
    }

    const vehicles = await Vehicle.find({
      ownerType: req.user.role,
      ownerId: ownerProfile._id
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
      pending: ["confirmed", "ongoing", "cancelled"],
      confirmed: ["ongoing", "cancelled"],
      ongoing: ["returned", "completed"],
      returned: ["completed"],
      completed: [],
      cancelled: []
    };

    if (!transitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change booking from ${booking.status} to ${status}`
      });
    }

    booking.status = status;
    await booking.save();

    await refreshVehicleStatus(booking.vehicleId);

    // Send role-based in-app & email notifications
    try {
      const { sendNotification, sendRoleNotification } = require("../utils/notificationService");
      const customer = await User.findById(booking.customerId);

      if (status === "confirmed") {
        // Host Approved -> Customer pays
        if (customer) {
          await sendNotification({
            userId: customer._id,
            role: "customer",
            type: "booking_confirmed",
            title: "Booking Approved! Please Pay",
            message: `Host confirmed your booking for ${vehicle.brand} ${vehicle.model} (#${booking.bookingid}). Click to pay ₹${booking.totalAmount} to finalize.`,
            link: `/customer/dashboard?tab=bookings&payBookingId=${booking._id}`
          });
        }
        await sendNotification({
          userId: req.user.id,
          role: req.user.role,
          type: "booking_confirmed",
          title: "Booking Confirmed by You",
          message: `You accepted booking #${booking.bookingid}. Waiting for customer payment / scheduled handover.`,
          link: req.user.role === "agency" ? "/agency/dashboard?tab=bookings" : "/owner/dashboard?tab=bookings"
        });
      } else if (status === "ongoing") {
        // Handover / Start Trip
        if (customer) {
          await sendNotification({
            userId: customer._id,
            role: "customer",
            type: "booking",
            title: "Vehicle Handed Over (Trip Started)",
            message: `Your rental for ${vehicle.brand} ${vehicle.model} has officially started. Drive safely!`,
            link: "/customer/dashboard?tab=bookings"
          });
        }
        await sendNotification({
          userId: req.user.id,
          role: req.user.role,
          type: "booking",
          title: "Handover Complete",
          message: `You have successfully handed over ${vehicle.brand} ${vehicle.model} to ${customer?.name || "the customer"}. Rental is now ongoing.`,
          link: req.user.role === "agency" ? "/agency/dashboard" : "/owner/dashboard"
        });
      } else if (status === "returned" || status === "completed") {
        // Return / Complete Trip
        if (customer) {
          await sendNotification({
            userId: customer._id,
            role: "customer",
            type: "booking",
            title: "Rental Completed",
            message: `Thank you for returning ${vehicle.brand} ${vehicle.model}! We hope you had a great journey. Please leave a review!`,
            link: "/customer/dashboard"
          });
        }
        await sendNotification({
          userId: req.user.id,
          role: req.user.role,
          type: "booking",
          title: "Vehicle Returned",
          message: `${vehicle.brand} ${vehicle.model} has been marked as returned and is now available for new bookings.`,
          link: req.user.role === "agency" ? "/agency/dashboard" : "/owner/dashboard"
        });
      }

      if (customer) {
        const { sendBookingStatusUpdate } = require("../services/emailService");
        await sendBookingStatusUpdate(customer, booking, `Your booking status has been updated to "${status}".`);
      }
    } catch (eErr) {
      console.warn("Booking status notification error:", eErr.message);
    }

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

    // SRS 3.1.3.4 & 3.1.4.2: Tiered Refund Policy on Cancellation
    // Calculate time remaining until booking start date
    const now = new Date();
    const startTime = new Date(booking.startDate);
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 0;
    let tierExplanation = "";

    if (hoursUntilStart >= 24) {
      refundPercentage = 100;
      tierExplanation = "Full refund (100%) applied (cancelled 24+ hours before start).";
    } else if (hoursUntilStart >= 12) {
      refundPercentage = 50;
      tierExplanation = "Partial refund (50%) applied (cancelled between 12-24 hours before start).";
    } else {
      refundPercentage = 0;
      tierExplanation = "No refund (0%) applied (cancelled less than 12 hours before start).";
    }

    let calculatedRefund = 0;
    if (booking.paymentStatus === "paid") {
      calculatedRefund = Math.round(((booking.totalAmount + (booking.securityDeposit || 0)) * refundPercentage) / 100);
      booking.refundAmount = calculatedRefund;

      // Update associated payment record
      const payment = await Payment.findOne({
        bookingId: booking._id,
        status: "completed"
      });

      if (payment) {
        payment.refundAmount = calculatedRefund;
        payment.refundStatus = calculatedRefund > 0 ? "completed" : "not_requested";
        payment.refundedAt = calculatedRefund > 0 ? new Date() : null;
        if (calculatedRefund >= payment.amount) {
          payment.status = "refunded";
          booking.paymentStatus = "refunded";
        }
        await payment.save();
      }
    }

    await booking.save();
    await refreshVehicleStatus(booking.vehicleId);

    // Send notifications on cancellation
    try {
      const { sendNotification, sendRoleNotification } = require("../utils/notificationService");
      const customer = await User.findById(booking.customerId);

      // 1. Customer notification
      if (customer) {
        await sendNotification({
          userId: customer._id,
          role: "customer",
          type: "booking_cancelled",
          title: "Booking Cancelled",
          message: `Booking #${booking.bookingid} has been cancelled. ${tierExplanation} Refund Amount: ₹${calculatedRefund}`,
          link: "/customer/dashboard"
        });

        // Email
        try {
          const { sendBookingStatusUpdate } = require("../services/emailService");
          await sendBookingStatusUpdate(
            customer,
            booking,
            `Your booking has been cancelled. ${tierExplanation} Refund Amount: ₹${calculatedRefund}`
          );
        } catch (eErr) {
          console.warn("Booking cancel email error:", eErr.message);
        }
      }

      // 2. Owner / Agency notification
      if (vehicle) {
        const owner = await getVehicleOwner(vehicle);
        if (owner && owner.userId) {
          await sendNotification({
            userId: owner.userId,
            role: vehicle.ownerType || "owner",
            type: "booking_cancelled",
            title: "Booking Cancelled by Customer",
            message: `Reservation #${booking.bookingid} for your ${vehicle.brand} ${vehicle.model} was cancelled by the customer.`,
            link: vehicle.ownerType === "agency" ? "/agency/dashboard" : "/owner/dashboard"
          });
        }
      }

      // 3. Admin notification
      await sendRoleNotification("admin", {
        type: "booking_cancelled",
        title: "Booking Cancellation Notice",
        message: `Booking #${booking.bookingid} was cancelled. Calculated refund: ₹${calculatedRefund}.`,
        link: "/admin/dashboard"
      });
    } catch (nErr) {
      console.warn("Booking cancel notification error:", nErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
      refundDetails: {
        hoursUntilStart: Math.max(0, Math.round(hoursUntilStart * 10) / 10),
        refundPercentage,
        refundAmount: calculatedRefund,
        explanation: tierExplanation,
      }
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