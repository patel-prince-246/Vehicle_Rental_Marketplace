const express = require("express");

const {
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
  getDashboardStats
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();


// All admin routes require admin authentication
router.use(
  authMiddleware,
  roleMiddleware("admin")
);


// Dashboard
router.get(
  "/dashboard",
  getDashboardStats
);


// Users
router.get(
  "/users",
  getAllUsers
);

router.get(
  "/users/:id",
  getUserById
);

router.put(
  "/users/:id/status",
  updateUserStatus
);

router.delete(
  "/users/:id",
  deleteUser
);


// Owners
router.get(
  "/owners",
  getAllOwners
);

router.put(
  "/owners/:id/verify",
  verifyOwner
);


// Agencies
router.get(
  "/agencies",
  getAllAgencies
);

router.put(
  "/agencies/:id/verify",
  verifyAgency
);


// Vehicles
router.get(
  "/vehicles",
  getAllVehicles
);

router.put(
  "/vehicles/:id/verify",
  verifyVehicle
);

router.put(
  "/vehicles/:id/reject",
  rejectVehicle
);


// Bookings
router.get(
  "/bookings",
  getAllBookings
);


// Payments
router.get(
  "/payments",
  getAllPayments
);


// Reviews
router.get(
  "/reviews",
  getAllReviews
);


module.exports = router;