const express = require("express");

const {
  createBooking,
  getAllBookings,
  getMyBookings,
  getOwnerBookings,
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

module.exports = router;