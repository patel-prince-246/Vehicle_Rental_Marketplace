const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'mock_paid', 'failed', 'refunded'], default: 'pending' },
  refundAmount: { type: Number, default: 0 },
  paymentDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);