const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// Create a booking
exports.createBooking = async (req, res) => {
  try {
    const { vehicleId, consumerId, bookingType, startDateTime, endDateTime, pickupLocation, totalAmount } = req.body;

    // Check consumer's license status
    const consumer = await User.findById(consumerId);
    if (!consumer) return res.status(404).json({ message: "Consumer not found" });
    if (!consumer.license || consumer.license.status !== 'uploaded') {
      return res.status(403).json({ message: "Please upload your driving license before booking" });
    }

    // Check vehicle availability
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    if (vehicle.status !== 'available') {
      return res.status(400).json({ message: "Sorry, vehicle not available for selected time" });
    }

    const booking = await Booking.create({
      vehicleId,
      consumerId,
      ownerId: vehicle.ownerId,
      bookingType,
      startDateTime,
      endDateTime,
      pickupLocation,
      totalAmount
    });

    // Mark vehicle as booked
    vehicle.status = 'booked';
    await vehicle.save();

    res.status(201).json({ message: "Booking Successful", booking });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all bookings (for a user, filtered by query)
exports.getAllBookings = async (req, res) => {
  try {
    const { consumerId, ownerId } = req.query;
    const filter = {};
    if (consumerId) filter.consumerId = consumerId;
    if (ownerId) filter.ownerId = ownerId;

    const bookings = await Booking.find(filter)
      .populate('vehicleId')
      .populate('consumerId', 'name email phone');

    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single booking
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('vehicleId')
      .populate('consumerId', 'name email phone');
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update booking status (confirm / ongoing / returned)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // If returned, free up the vehicle
    if (status === 'returned') {
      await Vehicle.findByIdAndUpdate(booking.vehicleId, { status: 'available' });
    }

    res.status(200).json({ message: "Booking status updated successfully", booking });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cancel booking (with tiered refund logic)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const now = new Date();
    const hoursDiff = (new Date(booking.startDateTime) - now) / (1000 * 60 * 60);

    let refundPercent = 0;
    if (hoursDiff > 24) refundPercent = 90;
    else if (hoursDiff >= 6) refundPercent = 50;
    else refundPercent = 0;

    const refundAmount = (booking.totalAmount * refundPercent) / 100;

    booking.status = 'cancelled';
    await booking.save();

    // Free up the vehicle again
    await Vehicle.findByIdAndUpdate(booking.vehicleId, { status: 'available' });

    res.status(200).json({ message: "Booking cancelled", refundAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};