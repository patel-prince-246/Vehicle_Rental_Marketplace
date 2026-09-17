const express = require("express");

const {
  getAgencyProfile,
  updateAgencyProfile,
  getAllAgencies,
  getAgencyById,
  verifyAgency,
  rejectAgency,
  deleteAgency
} = require("../controllers/agencyController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();


// Agency profile
router.get(
  "/profile",
  authMiddleware,
  roleMiddleware("agency"),
  getAgencyProfile
);


// Update agency profile
router.put(
  "/profile",
  authMiddleware,
  roleMiddleware("agency"),
  updateAgencyProfile
);


// Admin - get all agencies
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getAllAgencies
);


// Admin - get agency by ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  getAgencyById
);


// Admin - verify agency
router.put(
  "/:id/verify",
  authMiddleware,
  roleMiddleware("admin"),
  verifyAgency
);


// Admin - reject agency
router.put(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("admin"),
  rejectAgency
);


// Admin - delete agency
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteAgency
);


module.exports = router;