const express = require("express");

const {
  createBooking,
  getAllBookings,
  getMyBookings,
  getOwnerBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  sendHandoverOtp,
  verifyHandoverOtp,
  sendReturnOtp,
  verifyReturnOtp
} = require("../controllers/bookingController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();


// Create booking
router.post(
  "/",
  authMiddleware,
  roleMiddleware("customer"),
  createBooking
);


// My bookings (customer)
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("customer"),
  getMyBookings
);


// Host / Agency incoming bookings
router.get(
  "/owner",
  authMiddleware,
  roleMiddleware("owner", "agency"),
  getOwnerBookings
);


// All bookings
router.get(
  "/",
  authMiddleware,
  roleMiddleware(
    "customer",
    "owner",
    "agency",
    "admin"
  ),
  getAllBookings
);


// Get booking by ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(
    "customer",
    "owner",
    "agency",
    "admin"
  ),
  getBookingById
);


// Update booking status
router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware(
    "owner",
    "agency",
    "admin"
  ),
  updateBookingStatus
);


// Cancel / Decline booking (supports POST, PATCH, and PUT)
router.post(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware(
    "customer",
    "owner",
    "agency",
    "admin"
  ),
  cancelBooking
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware(
    "customer",
    "owner",
    "agency",
    "admin"
  ),
  cancelBooking
);

router.put(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware(
    "customer",
    "owner",
    "agency",
    "admin"
  ),
  cancelBooking
);

// -------------------------------------------------------------
// OTP HANDOVER & RETURN VERIFICATION
// -------------------------------------------------------------

// 1. Send Handover OTP to customer email
router.post(
  "/:id/handover/send-otp",
  authMiddleware,
  roleMiddleware("owner", "agency", "admin"),
  sendHandoverOtp
);

// 2. Verify Handover OTP entered by host
router.post(
  "/:id/handover/verify-otp",
  authMiddleware,
  roleMiddleware("owner", "agency", "admin"),
  verifyHandoverOtp
);

// 3. Send Return OTP to customer email & evaluate late penalty
router.post(
  "/:id/return/send-otp",
  authMiddleware,
  roleMiddleware("owner", "agency", "admin"),
  sendReturnOtp
);

// 4. Verify Return OTP entered by host & finalize return
router.post(
  "/:id/return/verify-otp",
  authMiddleware,
  roleMiddleware("owner", "agency", "admin"),
  verifyReturnOtp
);

module.exports = router;