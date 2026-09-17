const express = require("express");

const {
  createReview,
  getVehicleReviews,
  getAllReviews,
  updateReview,
  deleteReview
} = require("../controllers/reviewController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();


// Create review
router.post(
  "/",
  authMiddleware,
  roleMiddleware("customer"),
  createReview
);


// Get reviews for a vehicle
router.get(
  "/vehicle/:vehicleId",
  getVehicleReviews
);


// Admin - all reviews
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getAllReviews
);


// Update own review
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("customer"),
  updateReview
);


// Delete review
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("customer", "admin"),
  deleteReview
);


module.exports = router;