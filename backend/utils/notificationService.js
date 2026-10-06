const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Send notification to a specific user
 */
const sendNotification = async ({
  userId,
  type = "system",
  message,
  role = "customer",
  title = "Notification",
  link = ""
}) => {
  try {
    if (!userId || !message) return null;
    return await Notification.create({
      userId,
      role,
      type,
      title: title || type.replace(/_/g, " ").toUpperCase(),
      message,
      link: link || ""
    });
  } catch (err) {
    console.error("sendNotification error:", err.message);
    return null;
  }
};

/**
 * Send notification to all users with a specific role (e.g. all admins)
 */
const sendRoleNotification = async (
  role,
  { type = "system", message, title = "Notification", link = "" }
) => {
  try {
    const users = await User.find({ role, isActive: true }).select("_id");
    if (!users || users.length === 0) return [];

    const notifs = users.map((u) => ({
      userId: u._id,
      role,
      type,
      title: title || type.replace(/_/g, " ").toUpperCase(),
      message,
      link: link || ""
    }));

    return await Notification.insertMany(notifs);
  } catch (err) {
    console.error("sendRoleNotification error:", err.message);
    return [];
  }
};

module.exports = {
  sendNotification,
  sendRoleNotification
};
