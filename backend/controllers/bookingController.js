
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
      securityDeposit,
      bookingType = "scheduled",
      durationHours,
      pickupCoordinates,
      returnCoordinates
    } = req.body;

    const isInstant = bookingType === "instant";

    if (!bookingid || !vehicleId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and vehicle ID are required"
      });
    }

    if (!isInstant && (!startDate || !endDate)) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required for scheduled bookings"
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

    let start = startDate ? new Date(startDate) : new Date();
    let end;
    let totalAmount = 0;
    const finalHours = isInstant ? Math.min(24, Math.max(1, Number(durationHours) || 4)) : undefined;

    if (isInstant) {
      // Instant booking under 24 hours based on nearby location
      end = new Date(start.getTime() + finalHours * 60 * 60 * 1000);
      const hourlyRate = (vehicle.pricePerDay || 600) / 24;
      totalAmount = Math.max(150, Math.round(hourlyRate * finalHours));
    } else {
      end = new Date(endDate);

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

      // Allow 15 min leeway for current time
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (start < fifteenMinAgo) {
        return res.status(400).json({
          success: false,
          message: "Booking start date cannot be in the past"
        });
      }

      const days = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      totalAmount = Math.max(vehicle.pricePerDay, days * vehicle.pricePerDay);
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
        message: "Vehicle is already booked for the selected time window"
      });
    }

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

    const adminCommission = Math.round(totalAmount * 0.15);
    const hostEarnings = totalAmount - adminCommission;
    const platformFee = 99;

    const booking = await Booking.create({
      bookingid,
      customerId: req.user.id,
      vehicleId,
      bookingType: isInstant ? "instant" : "scheduled",
      durationHours: finalHours,
      startDate: start,
      endDate: end,
      totalAmount,
      adminCommission,
      hostEarnings,
      platformFee,
      securityDeposit: deposit,
      pickupLocation: pickupLocation || vehicle.pickupLocationAddress || vehicle.city || "Pickup Station",
      returnLocation: returnLocation || vehicle.returnLocationAddress || vehicle.city || "Drop Station",
      pickupCoordinates: pickupCoordinates || {
        latitude: vehicle.latitude || 21.1702,
        longitude: vehicle.longitude || 72.8311
      },
      returnCoordinates: returnCoordinates || {
        latitude: vehicle.latitude || 21.1702,
        longitude: vehicle.longitude || 72.8311
      },
      status: "pending",
      paymentStatus: "pending"
    });

    // Send email confirmation to Customer & action request email to Host
    try {
      const { sendBookingConfirmation, sendNewBookingRequestToHost } = require("../services/emailService");
      await sendBookingConfirmation(customer, booking, vehicle);

      const owner = await getVehicleOwner(vehicle);
      if (owner && owner.email) {
        await sendNewBookingRequestToHost(owner, customer, booking, vehicle);
      }
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

    if (status === "cancelled") {
      // Delegate to cancellation logic
      return cancelBooking(req, res);
    }

    booking.status = status;
    await booking.save();

    await refreshVehicleStatus(booking.vehicleId);

    // Send role-based in-app & email notifications
    try {
      const { sendNotification, sendRoleNotification } = require("../utils/notificationService");
      const host = await getVehicleOwner(vehicle);

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

          // Email customer that host accepted the reservation
          const { sendBookingAcceptedToCustomer } = require("../services/emailService");
          await sendBookingAcceptedToCustomer(customer, booking, vehicle, host).catch((err) =>
            console.warn("Accepted email error:", err.message)
          );
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
        // Handover / Start Trip (Vehicle received by customer)
        if (customer) {
          await sendNotification({
            userId: customer._id,
            role: "customer",
            type: "booking",
            title: "Vehicle Handed Over (Trip Started)",
            message: `Your rental for ${vehicle.brand} ${vehicle.model} has officially started. Drive safely!`,
            link: "/customer/dashboard?tab=bookings"
          });

          const { sendVehicleReceivedToCustomer } = require("../services/emailService");
          await sendVehicleReceivedToCustomer(customer, host, booking, vehicle).catch((err) =>
            console.warn("Customer vehicle received email error:", err.message)
          );
        }
        await sendNotification({
          userId: req.user.id,
          role: req.user.role,
          type: "booking",
          title: "Handover Complete",
          message: `You have successfully handed over ${vehicle.brand} ${vehicle.model} to ${customer?.name || "the customer"}. Rental is now ongoing.`,
          link: req.user.role === "agency" ? "/agency/dashboard" : "/owner/dashboard"
        });

        // Email to Host confirming vehicle received by customer
        if (host && host.email) {
          const { sendVehicleHandoverToHost } = require("../services/emailService");
          await sendVehicleHandoverToHost(host, customer, booking, vehicle).catch((err) =>
            console.warn("Host vehicle handover email error:", err.message)
          );
        }
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

          // Email customer requesting review & feedback
          const { sendReviewRequestEmail } = require("../services/emailService");
          await sendReviewRequestEmail(customer, booking, vehicle).catch((err) =>
            console.warn("Review request email error:", err.message)
          );
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
// CANCEL / DECLINE BOOKING
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

    const cancellationReason =
      req.body.cancellationReason?.trim() ||
      (isOwner
        ? "Vehicle is currently unavailable or undergoing maintenance."
        : "Booking cancelled by customer.");

    const cancelledBy = isOwner
      ? (vehicle?.ownerType || "owner")
      : isAdmin
      ? "admin"
      : "customer";

    booking.status = "cancelled";
    booking.cancelledBy = cancelledBy;
    booking.cancellationReason = cancellationReason;

    // Refund Logic:
    // If Host or Admin cancels/declines -> 100% Full Refund guaranteed to Customer
    // If Customer cancels -> Tiered Refund policy based on lead time
    let refundPercentage = 0;
    let tierExplanation = "";

    const now = new Date();
    const startTime = new Date(booking.startDate);
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (cancelledBy === "owner" || cancelledBy === "agency" || cancelledBy === "admin") {
      refundPercentage = 100;
      tierExplanation = `Host / Admin cancelled: Full 100% refund applied to customer. Reason: "${cancellationReason}"`;
    } else {
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
        const customerMsg = (cancelledBy === "owner" || cancelledBy === "agency")
          ? `Your booking request #${booking.bookingid} for ${vehicle?.brand || "vehicle"} was declined by the host. Reason: "${cancellationReason}". ${calculatedRefund > 0 ? `Full Refund of ₹${calculatedRefund} processed.` : ""}`
          : `Booking #${booking.bookingid} has been cancelled. ${tierExplanation} Refund Amount: ₹${calculatedRefund}`;

        await sendNotification({
          userId: customer._id,
          role: "customer",
          type: "booking_cancelled",
          title: (cancelledBy === "owner" || cancelledBy === "agency") ? "Booking Request Declined by Host" : "Booking Cancelled",
          message: customerMsg,
          link: "/customer/dashboard?tab=bookings"
        });

        // Email customer
        try {
          const owner = vehicle ? await getVehicleOwner(vehicle) : null;
          if (cancelledBy === "owner" || cancelledBy === "agency") {
            const { sendBookingDeclinedToCustomer } = require("../services/emailService");
            await sendBookingDeclinedToCustomer(
              customer,
              booking,
              vehicle,
              owner,
              cancellationReason
            );
          } else {
            const { sendBookingStatusUpdate } = require("../services/emailService");
            await sendBookingStatusUpdate(customer, booking, customerMsg);
          }
        } catch (eErr) {
          console.warn("Booking cancel email error:", eErr.message);
        }
      }

      // 2. Owner / Agency notification
      if (vehicle) {
        const owner = await getVehicleOwner(vehicle);
        if (owner && owner.userId) {
          const hostMsg = (cancelledBy === "customer")
            ? `Reservation #${booking.bookingid} for your ${vehicle.brand} ${vehicle.model} was cancelled by the customer.`
            : `You declined/cancelled booking #${booking.bookingid} for ${vehicle.brand} ${vehicle.model}. Reason: "${cancellationReason}".`;

          await sendNotification({
            userId: owner.userId,
            role: vehicle.ownerType || "owner",
            type: "booking_cancelled",
            title: (cancelledBy === "customer") ? "Booking Cancelled by Customer" : "Booking Request Declined",
            message: hostMsg,
            link: vehicle.ownerType === "agency" ? "/agency/dashboard?tab=bookings" : "/owner/dashboard?tab=bookings"
          });
        }
      }

      // 3. Admin notification
      await sendRoleNotification("admin", {
        type: "booking_cancelled",
        title: "Booking Cancellation Notice",
        message: `Booking #${booking.bookingid} was cancelled by ${cancelledBy}. Reason: ${cancellationReason}. Refund: ₹${calculatedRefund}.`,
        link: "/admin/dashboard?tab=bookings"
      });
    } catch (nErr) {
      console.warn("Booking cancel notification error:", nErr.message);
    }

    return res.status(200).json({
      success: true,
      message: (cancelledBy === "owner" || cancelledBy === "agency") ? "Booking request declined with reason." : "Booking cancelled successfully",
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

// ==============================
// 1. SEND HANDOVER OTP (To Customer Email)
// Initiated by Owner / Agency when ready to give vehicle keys
// ==============================
const sendHandoverOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate("customerId").populate("vehicleId");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const vehicle = booking.vehicleId;
    const customer = booking.customerId;

    const isAdmin = req.user.role === "admin";
    const hasAccess = await hasVehicleAccess(vehicle, req.user);
    if (!isAdmin && !hasAccess) {
      return res.status(403).json({ success: false, message: "Unauthorized: only vehicle host can initiate handover" });
    }

    if (!["confirmed", "pending"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot initiate handover for a booking with status '${booking.status}'. Status must be confirmed.`
      });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    booking.handoverOtp = {
      code: otp,
      expiresAt,
      isVerified: false
    };
    await booking.save();

    const host = await getVehicleOwner(vehicle);
    const { sendHandoverOtpToCustomer, isSmtpConfigured } = require("../services/emailService");
    await sendHandoverOtpToCustomer(customer, booking, vehicle, host, otp);

    return res.status(200).json({
      success: true,
      message: `Handover OTP sent to customer (${customer.email}). Ask customer to share the code after inspecting vehicle keys.`,
      customerEmail: customer.email,
      devOtp: isSmtpConfigured() ? undefined : otp
    });
  } catch (error) {
    console.error("Send Handover OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error sending handover OTP", error: error.message });
  }
};

// ==============================
// 2. VERIFY HANDOVER OTP
// Entered by Host when customer provides code
// ==============================
const verifyHandoverOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: "Handover OTP code is required" });
    }

    const booking = await Booking.findById(id).populate("customerId").populate("vehicleId");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const vehicle = booking.vehicleId;
    const customer = booking.customerId;

    const isAdmin = req.user.role === "admin";
    const hasAccess = await hasVehicleAccess(vehicle, req.user);
    if (!isAdmin && !hasAccess) {
      return res.status(403).json({ success: false, message: "Unauthorized to verify handover for this booking" });
    }

    if (!booking.handoverOtp || !booking.handoverOtp.code) {
      return res.status(400).json({
        success: false,
        message: "No handover OTP has been generated yet. Please click 'Send Handover OTP' first."
      });
    }

    if (new Date() > new Date(booking.handoverOtp.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "Handover OTP has expired. Please click 'Resend OTP' to send a fresh code."
      });
    }

    if (String(booking.handoverOtp.code).trim() !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Handover OTP. Please ask the customer to check their latest email or click Resend."
      });
    }

    // Mark verified and update statuses
    booking.handoverOtp.isVerified = true;
    booking.handoverOtp.verifiedAt = new Date();
    booking.status = "ongoing";
    await booking.save();

    await refreshVehicleStatus(vehicle._id || vehicle);

    try {
      const { sendNotification } = require("../utils/notificationService");
      const { sendVehicleReceivedToCustomer } = require("../services/emailService");
      const host = await getVehicleOwner(vehicle);

      await sendNotification({
        userId: customer._id,
        role: "customer",
        type: "booking",
        title: "Vehicle Handover Confirmed! 🚗",
        message: `Your rental for ${vehicle.brand} ${vehicle.model} has started. Have a safe journey!`,
        link: "/customer/dashboard?tab=bookings"
      });

      await sendVehicleReceivedToCustomer(customer, host, booking, vehicle).catch(() => {});
    } catch (nErr) {
      console.warn("Handover notification error:", nErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Handover verified successfully! Vehicle handed over to customer. Status is now ONGOING.",
      booking
    });
  } catch (error) {
    console.error("Verify Handover OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error verifying handover OTP", error: error.message });
  }
};

// ==============================
// 3. SEND RETURN OTP & CHECK LATE PENALTY
// Initiated by Host when vehicle is brought back
// ==============================
const sendReturnOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate("customerId").populate("vehicleId");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const vehicle = booking.vehicleId;
    const customer = booking.customerId;

    const isAdmin = req.user.role === "admin";
    const hasAccess = await hasVehicleAccess(vehicle, req.user);
    if (!isAdmin && !hasAccess) {
      return res.status(403).json({ success: false, message: "Unauthorized to process return for this vehicle" });
    }

    if (booking.status !== "ongoing") {
      return res.status(400).json({
        success: false,
        message: `Cannot initiate return for booking with status '${booking.status}'. Booking must be ongoing.`
      });
    }

    // Check if return is late
    const now = new Date();
    const scheduledEnd = new Date(booking.endDate);
    const isLate = now > scheduledEnd;
    let lateHours = 0;
    let penaltyAmount = 0;

    if (isLate) {
      const diffMs = now.getTime() - scheduledEnd.getTime();
      lateHours = Math.ceil(diffMs / (1000 * 60 * 60));
      // Hourly late penalty: ₹200/hr or 1.5x hourly rate
      const hourlyRate = Math.round((vehicle.pricePerDay || 600) / 24);
      penaltyAmount = Math.max(200 * lateHours, Math.round(hourlyRate * 1.5 * lateHours));
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    booking.returnOtp = {
      code: otp,
      expiresAt,
      isVerified: false
    };
    booking.isLateReturn = isLate;
    booking.lateHours = lateHours;
    booking.penaltyAmount = penaltyAmount;
    booking.penaltyReason = isLate ? `Late return by ${lateHours} hour(s)` : "";
    await booking.save();

    const host = await getVehicleOwner(vehicle);
    const { sendReturnOtpToCustomer, isSmtpConfigured } = require("../services/emailService");
    await sendReturnOtpToCustomer(customer, booking, vehicle, host, otp, {
      isLate,
      lateHours,
      penaltyAmount
    });

    return res.status(200).json({
      success: true,
      message: `Return OTP sent to customer (${customer.email}).${isLate ? ` ⚠️ Late return detected (${lateHours} hr late). Extra penalty: ₹${penaltyAmount}.` : " Returned on schedule."}`,
      customerEmail: customer.email,
      isLate,
      lateHours,
      penaltyAmount,
      devOtp: isSmtpConfigured() ? undefined : otp
    });
  } catch (error) {
    console.error("Send Return OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error sending return OTP", error: error.message });
  }
};

// ==============================
// 4. VERIFY RETURN OTP & CHARGE PENALTY
// ==============================
const verifyReturnOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: "Return OTP code is required" });
    }

    const booking = await Booking.findById(id).populate("customerId").populate("vehicleId");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const vehicle = booking.vehicleId;
    const customer = booking.customerId;

    const isAdmin = req.user.role === "admin";
    const hasAccess = await hasVehicleAccess(vehicle, req.user);
    if (!isAdmin && !hasAccess) {
      return res.status(403).json({ success: false, message: "Unauthorized to verify return for this vehicle" });
    }

    if (!booking.returnOtp || !booking.returnOtp.code) {
      return res.status(400).json({
        success: false,
        message: "No return OTP generated yet. Please click 'Generate Return OTP' first."
      });
    }

    if (new Date() > new Date(booking.returnOtp.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "Return OTP has expired. Please click 'Resend OTP' to generate a new code."
      });
    }

    if (String(booking.returnOtp.code).trim() !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Return OTP. Please check the code with customer or resend."
      });
    }

    const now = new Date();
    booking.returnOtp.isVerified = true;
    booking.returnOtp.verifiedAt = now;
    booking.actualReturnDate = now;
    booking.status = "returned";
    await booking.save();

    // Set vehicle back to available
    vehicle.status = "available";
    await vehicle.save();

    try {
      const { sendNotification } = require("../utils/notificationService");
      const { sendReviewRequestEmail, sendLateReturnPenaltyNotice } = require("../services/emailService");

      if (booking.isLateReturn && booking.penaltyAmount > 0) {
        await sendLateReturnPenaltyNotice(customer, booking, vehicle, booking.penaltyAmount, booking.lateHours).catch(() => {});
      }

      await sendNotification({
        userId: customer._id,
        role: "customer",
        type: "booking",
        title: "Vehicle Returned Successfully! 🏁",
        message: `Your return for ${vehicle.brand} ${vehicle.model} has been verified and completed.${booking.penaltyAmount > 0 ? ` Additional late penalty applied: ₹${booking.penaltyAmount}.` : ""}`,
        link: "/customer/dashboard?tab=bookings"
      });

      await sendReviewRequestEmail(customer, booking, vehicle).catch(() => {});
    } catch (nErr) {
      console.warn("Return notification error:", nErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Return verified successfully! Vehicle returned.${booking.isLateReturn ? ` Late penalty charged: ₹${booking.penaltyAmount} (${booking.lateHours} hours late).` : ""}`,
      booking,
      penaltyDetails: {
        isLate: booking.isLateReturn,
        lateHours: booking.lateHours,
        penaltyAmount: booking.penaltyAmount,
        penaltyReason: booking.penaltyReason
      }
    });
  } catch (error) {
    console.error("Verify Return OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error verifying return OTP", error: error.message });
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
  cancelBooking,
  sendHandoverOtp,
  verifyHandoverOtp,
  sendReturnOtp,
  verifyReturnOtp
};