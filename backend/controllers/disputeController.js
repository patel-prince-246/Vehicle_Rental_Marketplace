const mongoose = require("mongoose");
const Dispute = require("../models/Dispute");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const Notification = require("../models/Notification");

// ==============================
// CREATE / RAISE DISPUTE
// ==============================
const createDispute = async (req, res) => {
  try {
    const { bookingId, title, reason, description } = req.body;

    if (!bookingId || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "Booking ID, title, and description are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking = await Booking.findById(bookingId).populate("vehicleId");
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const disputeId = "DISP-" + Date.now().toString().slice(-6);

    const dispute = await Dispute.create({
      disputeId,
      bookingId: booking._id,
      vehicleId: booking.vehicleId._id,
      raisedBy: req.user.id,
      againstUser:
        booking.customerId.toString() === req.user.id
          ? undefined
          : booking.customerId,
      title: title.trim(),
      reason: reason || "other",
      description: description.trim(),
      status: "open",
    });

    // Send role-based notifications
    try {
      const { sendNotification, sendRoleNotification } = require("../utils/notificationService");

      // 1. User who raised dispute
      await sendNotification({
        userId: req.user.id,
        role: req.user.role || "customer",
        type: "dispute_raised",
        title: "Dispute Registered",
        message: `Your dispute (#${disputeId}) has been registered and is pending administrator investigation.`,
        link: req.user.role === "owner" ? "/owner/dashboard" : "/customer/dashboard"
      });

      // 2. Admins
      await sendRoleNotification("admin", {
        type: "dispute_raised",
        title: "New Dispute Lodged",
        message: `Dispute #${disputeId} submitted by user regarding booking #${booking.bookingid || booking._id}: "${title}".`,
        link: "/admin/dashboard"
      });
    } catch (nErr) {
      console.warn("Dispute notification error:", nErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Dispute submitted successfully.",
      dispute,
    });
  } catch (error) {
    console.error("Create Dispute Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==============================
// GET MY DISPUTES (User / Owner)
// ==============================
const getMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({ raisedBy: req.user.id })
      .populate("bookingId")
      .populate("vehicleId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: disputes.length,
      disputes,
    });
  } catch (error) {
    console.error("Get My Disputes Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==============================
// GET ALL DISPUTES (Admin)
// ==============================
const getAllDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find()
      .populate("bookingId")
      .populate("vehicleId")
      .populate("raisedBy", "name email phone role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: disputes.length,
      disputes,
    });
  } catch (error) {
    console.error("Get All Disputes Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==============================
// UPDATE / RESOLVE DISPUTE (Admin)
// ==============================
const updateDisputeStatus = async (req, res) => {
  try {
    const { status, resolution, adminNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid dispute ID",
      });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: "Dispute not found",
      });
    }

    if (status) dispute.status = status;
    if (resolution !== undefined) dispute.resolution = resolution;
    if (adminNotes !== undefined) dispute.adminNotes = adminNotes;

    if (["resolved", "dismissed"].includes(status)) {
      dispute.resolvedAt = new Date();
    }

    await dispute.save();

    // Notify user
    try {
      const { sendNotification } = require("../utils/notificationService");
      await sendNotification({
        userId: dispute.raisedBy,
        type: "dispute_updated",
        title: `Dispute ${dispute.status.toUpperCase()}`,
        message: `Your dispute (#${dispute.disputeId}) status has been updated to "${dispute.status}". Resolution: ${resolution || adminNotes || "Case evaluated by support."}`,
        link: "/customer/dashboard"
      });
    } catch (nErr) {
      console.warn("Notification error:", nErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Dispute updated successfully",
      dispute,
    });
  } catch (error) {
    console.error("Update Dispute Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createDispute,
  getMyDisputes,
  getAllDisputes,
  updateDisputeStatus,
};
