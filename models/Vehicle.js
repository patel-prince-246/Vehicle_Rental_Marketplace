const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['car', 'bike'], required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  pricePerDay: { type: Number, required: true },
  city: { type: String, required: true },
  status: { type: String, enum: ['available', 'booked', 'inactive'], default: 'available' }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);