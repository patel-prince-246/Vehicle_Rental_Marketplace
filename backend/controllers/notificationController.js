const Notification = require("../models/Notification");


// ==============================
// CREATE NOTIFICATION
// ==============================
const createNotification = async (req, res) => {
  try {
    const {
      userId,
      type,
      message
    } = req.body;

    if (
      !userId ||
      !type ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        message: "User ID, notification type and message are required"
      });
    }

    const notification =
      await Notification.create({
        userId,
        type,
        message
      });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification
    });

  } catch (error) {
    console.error("Create Notification Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET MY NOTIFICATIONS
// ==============================
const getMyNotifications = async (req, res) => {
  try {
    const notifications =
      await Notification.find({
        userId: req.user.id
      }).sort({
        createdAt: -1
      });

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });

  } catch (error) {
    console.error("Get Notifications Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// MARK AS READ
// ==============================
const markAsRead = async (req, res) => {
  try {
    const notification =
      await Notification.findById(
        req.params.id
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    if (
      notification.userId.toString() !==
      req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    notification.isRead = true;

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification
    });

  } catch (error) {
    console.error("Mark Notification Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// MARK ALL AS READ
// ==============================
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.user.id,
        isRead: false
      },
      {
        $set: {
          isRead: true
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });

  } catch (error) {
    console.error(
      "Mark All Notifications Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// DELETE NOTIFICATION
// ==============================
const deleteNotification = async (req, res) => {
  try {
    const notification =
      await Notification.findById(
        req.params.id
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    if (
      notification.userId.toString() !==
      req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    await Notification.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });

  } catch (error) {
    console.error("Delete Notification Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};