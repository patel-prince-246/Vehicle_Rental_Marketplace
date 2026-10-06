const express = require("express");

const {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getMyVehicles,
  verifyVehicle,
  rejectVehicle,
  getDistinctLocations
} = require("../controllers/vehicleController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { uploadVehicleImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public active vehicle locations list
router.get("/locations", getDistinctLocations);

// Public vehicle search
router.get("/", getAllVehicles);


// Logged-in agency/owner vehicles
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("agency", "owner"),
  getMyVehicles
);


// Get vehicle details
router.get(
  "/:id",
  getVehicleById
);


// Create vehicle - Agency and Owner
router.post(
  "/",
  authMiddleware,
  roleMiddleware("agency", "owner"),
  uploadVehicleImage.single("image"),
  createVehicle
);


// Update vehicle - Agency, Owner (and Admin)
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("agency", "owner", "admin"),
  uploadVehicleImage.single("image"),
  updateVehicle
);


// Delete vehicle - Agency, Owner (and Admin)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("agency", "owner", "admin"),
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