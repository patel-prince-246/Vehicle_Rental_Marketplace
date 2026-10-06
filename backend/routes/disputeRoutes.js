const express = require("express");
const {
  createDispute,
  getMyDisputes,
  getAllDisputes,
  updateDisputeStatus,
} = require("../controllers/disputeController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// File a dispute
router.post("/", authMiddleware, createDispute);

// Get my disputes
router.get("/my-disputes", authMiddleware, getMyDisputes);

// Admin: Get all disputes
router.get("/all", authMiddleware, roleMiddleware("admin"), getAllDisputes);

// Admin: Update dispute status / resolution
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateDisputeStatus);

module.exports = router;
