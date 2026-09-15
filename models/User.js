const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  city: { type: String, required: true },
  role: { type: String, enum: ['consumer', 'owner', 'admin'], required: true },
  address: { type: String },
  profilePhoto: { type: String },

  license: {
    licenseNumber: { type: String },
    imageUrl: { type: String },
    status: {
      type: String,
      enum: ['not_uploaded', 'uploaded', 'verified', 'rejected'],
      default: 'not_uploaded'
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);