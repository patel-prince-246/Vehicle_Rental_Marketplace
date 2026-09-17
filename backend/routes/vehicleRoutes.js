const express = require("express");

const {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getMyVehicles,
  verifyVehicle,
  rejectVehicle
} = require("../controllers/vehicleController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();


// Public vehicle search
router.get("/", getAllVehicles);


// Logged-in owner/agency vehicles
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("owner", "agency"),
  getMyVehicles
);


// Get vehicle details
router.get(
  "/:id",
  getVehicleById
);


// Create vehicle
router.post(
  "/",
  authMiddleware,
  roleMiddleware("owner", "agency"),
  createVehicle
);


// Update vehicle
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("owner", "agency", "admin"),
  updateVehicle
);


// Delete vehicle
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("owner", "agency", "admin"),
  deleteVehicle
);


// Admin verify
router.put(
  "/:id/verify",
  authMiddleware,
  roleMiddleware("admin"),
  verifyVehicle
);


// Admin reject
router.put(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("admin"),
  rejectVehicle
);


module.exports = router;