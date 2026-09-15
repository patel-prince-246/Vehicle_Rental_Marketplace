const Vehicle = require('../models/Vehicle');

// Add a new vehicle
exports.addVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all available vehicles 
// `(with optional filters)
exports.getAllVehicles = async (req, res) => {
  try {
    const { type, city, priceMin, priceMax } = req.query;
    const filter = { status: 'available' };

    if (type) filter.type = type;
    if (city) filter.city = city;
    if (priceMin || priceMax) {
      filter.pricePerDay = {};
      if (priceMin) filter.pricePerDay.$gte = Number(priceMin);
      if (priceMax) filter.pricePerDay.$lte = Number(priceMax);
    }

    const vehicles = await Vehicle.find(filter);
    res.status(200).json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single vehicle details
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.status(200).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update vehicle details
exports.updateVehicle = async (req, res) => {
  try {
    const updatedVehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updatedVehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.status(200).json(updatedVehicle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Remove/deactivate vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.status(200).json({ message: "Vehicle deactivated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};