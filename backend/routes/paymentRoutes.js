const express = require("express");

const {
  createPayment,
  getMyPayments,
  getPaymentById,
  refundPayment,
  getAllPayments
} = require("../controllers/paymentController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();


// Create payment
router.post(
  "/",
  authMiddleware,
  roleMiddleware("customer"),
  createPayment
);


// My payments
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("customer"),
  getMyPayments
);


// Get payment
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("customer", "admin"),
  getPaymentById
);


// Refund payment
router.patch(
  "/:id/refund",
  authMiddleware,
  roleMiddleware("admin"),
  refundPayment
);


// All payments
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getAllPayments
);


module.exports = router;