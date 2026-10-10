const express = require("express");
const router = express.Router();

const {
  createPayment,
  getMyPayments,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  requestRefund,
  processRefund,
  getRazorpayKey,
  createRazorpayOrder,
  verifyRazorpayPayment,
  confirmCashPayment,
} = require("../controllers/paymentController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Host (Owner/Agency) & Admin: manually confirm cash payment received
router.put(
  "/:bookingId/confirm-cash",
  authMiddleware,
  roleMiddleware("owner", "agency", "admin"),
  confirmCashPayment
);

router.post(
  "/:bookingId/confirm-cash",
  authMiddleware,
  roleMiddleware("owner", "agency", "admin"),
  confirmCashPayment
);

// Razorpay: get public key
router.get(
  "/razorpay-key",
  authMiddleware,
  getRazorpayKey
);

// Customer: create Razorpay order
router.post(
  "/create-razorpay-order",
  authMiddleware,
  roleMiddleware("customer"),
  createRazorpayOrder
);

// Customer: verify Razorpay payment
router.post(
  "/verify-razorpay-payment",
  authMiddleware,
  roleMiddleware("customer"),
  verifyRazorpayPayment
);

// Customer: create standard payment (cash/direct)
router.post(
  "/",
  authMiddleware,
  roleMiddleware("customer"),
  createPayment
);

// Customer: view own payments
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("customer"),
  getMyPayments
);

// Admin: view all payments
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getAllPayments
);

// Customer/Admin: view payment details
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("customer", "admin"),
  getPaymentById
);

// Admin: update payment status
router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware("admin"),
  updatePaymentStatus
);

// Customer/Admin: request a refund
router.post(
  "/:id/refund",
  authMiddleware,
  roleMiddleware("customer", "admin"),
  requestRefund
);

// Admin: process a refund
router.put(
  "/:id/refund/process",
  authMiddleware,
  roleMiddleware("admin"),
  processRefund
);

module.exports = router;
