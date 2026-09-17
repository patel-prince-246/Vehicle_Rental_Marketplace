const express = require("express");

const {
  createBooking,
  getAllBookings,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking
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


// My bookings
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("customer"),
  getMyBookings
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


// Cancel booking
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


module.exports = router;