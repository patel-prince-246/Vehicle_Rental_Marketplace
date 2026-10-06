const express = require("express");

const {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();


// Create notification
// Used by admin/system
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createNotification
);


// My notifications
router.get(
  "/my",
  authMiddleware,
  getMyNotifications
);


// Mark all as read (supports PATCH and PUT)
router.patch(
  "/read-all",
  authMiddleware,
  markAllAsRead
);
router.put(
  "/read-all",
  authMiddleware,
  markAllAsRead
);


// Mark notification as read (supports PATCH and PUT)
router.patch(
  "/:id/read",
  authMiddleware,
  markAsRead
);
router.put(
  "/:id/read",
  authMiddleware,
  markAsRead
);


// Delete notification
router.delete(
  "/:id",
  authMiddleware,
  deleteNotification
);


module.exports = router;