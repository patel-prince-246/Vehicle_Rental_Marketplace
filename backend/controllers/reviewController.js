const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");


// ==============================
// CREATE REVIEW
// ==============================
const createReview = async (req, res) => {
  try {
    const {
      vehicleId,
      bookingId,
      rating,
      comment
    } = req.body;

    if (
      !vehicleId ||
      !bookingId ||
      rating === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Vehicle, booking and rating are required"
      });
    }

    if (
      Number(rating) < 1 ||
      Number(rating) > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    const booking = await Booking.findById(
      bookingId
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (
      booking.customerId.toString() !==
      req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can review only your own booking"
      });
    }

    if (
      booking.vehicleId.toString() !==
      vehicleId
    ) {
      return res.status(400).json({
        success: false,
        message: "Vehicle does not match the booking"
      });
    }

    if (booking.status !== "returned" && booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Review can be submitted after vehicle return"
      });
    }

    const existingReview =
      await Review.findOne({
        bookingId,
        customerId: req.user.id
      });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this booking"
      });
    }

    const vehicle = await Vehicle.findById(
      vehicleId
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    const review = await Review.create({
      customerId: req.user.id,
      vehicleId,
      bookingId,
      rating,
      comment
    });

    // Send notifications to Host and Customer
    try {
      const { sendNotification, sendRoleNotification } = require("../utils/notificationService");
      const User = require("../models/User");
      const Owner = require("../models/Owner");
      const Agency = require("../models/Agency");

      const reviewer = await User.findById(req.user.id);
      const reviewerName = reviewer?.name || "Customer";

      // 1. Notify Host / Agency
      let hostDoc = null;
      if (vehicle.ownerType === "agency") {
        hostDoc = await Agency.findById(vehicle.ownerId);
      } else if (vehicle.ownerId) {
        hostDoc = await Owner.findById(vehicle.ownerId);
      }

      if (hostDoc && hostDoc.userId) {
        await sendNotification({
          userId: hostDoc.userId,
          role: vehicle.ownerType || "owner",
          type: "review_received",
          title: "New Customer Review & Rating",
          message: `${reviewerName} gave your ${vehicle.brand} a ${rating}★ rating: "${comment ? comment.slice(0, 60) + (comment.length > 60 ? '...' : '') : 'Great ride!'}"`,
          link: vehicle.ownerType === "agency" ? "/agency/dashboard" : "/owner/dashboard"
        });
      }

      // 2. Notify Customer
      await sendNotification({
        userId: req.user.id,
        role: "customer",
        type: "review_submitted",
        title: "Review Submitted",
        message: `Thank you for rating your trip with ${vehicle.brand} (${rating}★). Your feedback helps improve our community!`,
        link: "/customer/dashboard"
      });

      // 3. Notify Admin
      await sendRoleNotification("admin", {
        type: "review_submitted",
        title: "New Vehicle Review",
        message: `${reviewerName} submitted a ${rating}★ review for ${vehicle.brand} ${vehicle.model || ""}.`,
        link: "/admin/dashboard"
      });

      // 4. Send Review Emails to Both Sides (Host & Customer)
      const {
        sendReviewNotificationToHost,
        sendReviewConfirmationToCustomer
      } = require("../services/emailService");

      if (hostDoc && hostDoc.email) {
        await sendReviewNotificationToHost(hostDoc, reviewer, review, vehicle, booking).catch((err) =>
          console.warn("Review host email error:", err.message)
        );
      }

      if (reviewer && reviewer.email) {
        await sendReviewConfirmationToCustomer(reviewer, review, vehicle, booking).catch((err) =>
          console.warn("Review customer email error:", err.message)
        );
      }
    } catch (nErr) {
      console.warn("Review notification error:", nErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review
    });

  } catch (error) {
    console.error("Create Review Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET VEHICLE REVIEWS
// ==============================
const getVehicleReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      vehicleId: req.params.vehicleId
    })
      .populate("customerId", "name city email avatar")
      .populate("vehicleId", "brand model")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });

  } catch (error) {
    console.error("Get Vehicle Reviews Error:", error);

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
      .populate("customerId", "name email")
      .populate("vehicleId")
      .populate("bookingId");

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });

  } catch (error) {
    console.error("Get All Reviews Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// UPDATE REVIEW
// ==============================
const updateReview = async (req, res) => {
  try {
    const {
      rating,
      comment
    } = req.body;

    const review = await Review.findById(
      req.params.id
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    if (
      review.customerId.toString() !==
      req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can update only your own review"
      });
    }

    if (rating !== undefined) {
      if (
        Number(rating) < 1 ||
        Number(rating) > 5
      ) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5"
        });
      }

      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review
    });

  } catch (error) {
    console.error("Update Review Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// DELETE REVIEW
// ==============================
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(
      req.params.id
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    if (
      review.customerId.toString() !==
        req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this review"
      });
    }

    await Review.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });

  } catch (error) {
    console.error("Delete Review Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


module.exports = {
  createReview,
  getVehicleReviews,
  getAllReviews,
  updateReview,
  deleteReview
};