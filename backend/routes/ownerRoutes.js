const express = require("express");

const {
  getOwnerProfile,
  updateOwnerProfile,
  getAllOwners,
  getOwnerById,
  updateOwnerByAdmin,
  deleteOwner
} = require("../controllers/ownerController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();


// Owner profile
router.get(
  "/profile",
  authMiddleware,
  roleMiddleware("owner"),
  getOwnerProfile
);


// Update owner profile
router.put(
  "/profile",
  authMiddleware,
  roleMiddleware("owner"),
  updateOwnerProfile
);


// Admin - get all owners
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getAllOwners
);


// Admin - get owner by ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  getOwnerById
);


// Admin - update owner
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateOwnerByAdmin
);


// Admin - delete owner
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteOwner
);


module.exports = router;