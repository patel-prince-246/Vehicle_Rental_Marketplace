const Vehicle = require("../models/Vehicle");
const Owner = require("../models/Owner");
const Agency = require("../models/Agency");


// ==============================
// CREATE VEHICLE
// ==============================
const createVehicle = async (req, res) => {
  try {
    const {
      vehicleid,
      ownerType,
      ownerId,
      brand,
      model,
      type,
      pricePerDay,
      city,
      year,
      registrationNumber,
      imageUrl,
      description
    } = req.body;

    // Required fields
    if (
      !vehicleid ||
      !ownerType ||
      !ownerId ||
      !brand ||
      !model ||
      !type ||
      pricePerDay === undefined ||
      !city ||
      !year
    ) {
      return res.status(400).json({
        success: false,
        message: "All required vehicle fields must be provided"
      });
    }

    // Check owner type
    if (!["Owner", "Agency"].includes(ownerType)) {
      return res.status(400).json({
        success: false,
        message: "ownerType must be Owner or Agency"
      });
    }

    // Verify owner/agency exists
    let vehicleOwner;

    if (ownerType === "Owner") {
      vehicleOwner = await Owner.findById(ownerId);
    } else {
      vehicleOwner = await Agency.findById(ownerId);
    }

    if (!vehicleOwner) {
      return res.status(404).json({
        success: false,
        message: `${ownerType} not found`
      });
    }

    // Check duplicate vehicle ID
    const existingVehicle = await Vehicle.findOne({
      vehicleid
    });

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: "Vehicle ID already exists"
      });
    }

    const vehicle = await Vehicle.create({
      vehicleid,
      ownerType,
      ownerId,
      brand,
      model,
      type,
      pricePerDay,
      city,
      year,
      registrationNumber,
      imageUrl,
      description
    });

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      vehicle
    });

  } catch (error) {
    console.error("Create Vehicle Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET ALL VEHICLES
// ==============================
const getAllVehicles = async (req, res) => {
  try {
    const {
      type,
      city,
      minPrice,
      maxPrice,
      status,
      verificationStatus
    } = req.query;

    const filter = {};

    if (type) {
      filter.type = type;
    }

    if (city) {
      filter.city = {
        $regex: city,
        $options: "i"
      };
    }

    if (status) {
      filter.status = status;
    }

    if (verificationStatus) {
      filter.verificationStatus =
        verificationStatus;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.pricePerDay = {};

      if (minPrice !== undefined) {
        filter.pricePerDay.$gte =
          Number(minPrice);
      }

      if (maxPrice !== undefined) {
        filter.pricePerDay.$lte =
          Number(maxPrice);
      }
    }

    const vehicles = await Vehicle.find(filter)
      .populate("ownerId");

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles
    });

  } catch (error) {
    console.error("Get Vehicles Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET VEHICLE BY ID
// ==============================
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(
      req.params.id
    ).populate("ownerId");

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    res.status(200).json({
      success: true,
      vehicle
    });

  } catch (error) {
    console.error("Get Vehicle Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// UPDATE VEHICLE
// ==============================
const updateVehicle = async (req, res) => {
  try {
    const {
      brand,
      model,
      type,
      pricePerDay,
      city,
      year,
      registrationNumber,
      imageUrl,
      description,
      status
    } = req.body;

    const vehicle = await Vehicle.findById(
      req.params.id
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    // Only owner/agency who owns the vehicle
    // or admin can update it.
    if (req.user.role !== "admin") {

      let profile;

      if (req.user.role === "owner") {
        profile = await Owner.findOne({
          userId: req.user.id
        });
      }

      if (req.user.role === "agency") {
        profile = await Agency.findOne({
          userId: req.user.id
        });
      }

      if (!profile) {
        return res.status(403).json({
          success: false,
          message: "Owner profile not found"
        });
      }

      if (
        vehicle.ownerId.toString() !==
        profile._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can update only your own vehicle"
        });
      }
    }

    if (brand !== undefined) {
      vehicle.brand = brand;
    }

    if (model !== undefined) {
      vehicle.model = model;
    }

    if (type !== undefined) {
      vehicle.type = type;
    }

    if (pricePerDay !== undefined) {
      vehicle.pricePerDay = pricePerDay;
    }

    if (city !== undefined) {
      vehicle.city = city;
    }

    if (year !== undefined) {
      vehicle.year = year;
    }

    if (registrationNumber !== undefined) {
      vehicle.registrationNumber =
        registrationNumber;
    }

    if (imageUrl !== undefined) {
      vehicle.imageUrl = imageUrl;
    }

    if (description !== undefined) {
      vehicle.description = description;
    }

    if (status !== undefined) {
      vehicle.status = status;
    }

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      vehicle
    });

  } catch (error) {
    console.error("Update Vehicle Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// DELETE VEHICLE
// ==============================
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(
      req.params.id
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    // Admin can delete any vehicle
    if (req.user.role !== "admin") {

      let profile;

      if (req.user.role === "owner") {
        profile = await Owner.findOne({
          userId: req.user.id
        });
      }

      if (req.user.role === "agency") {
        profile = await Agency.findOne({
          userId: req.user.id
        });
      }

      if (!profile) {
        return res.status(403).json({
          success: false,
          message: "Owner profile not found"
        });
      }

      if (
        vehicle.ownerId.toString() !==
        profile._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can delete only your own vehicle"
        });
      }
    }

    await Vehicle.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully"
    });

  } catch (error) {
    console.error("Delete Vehicle Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET MY VEHICLES
// ==============================
const getMyVehicles = async (req, res) => {
  try {
    let ownerType;
    let ownerProfile;

    if (req.user.role === "owner") {
      ownerType = "Owner";

      ownerProfile = await Owner.findOne({
        userId: req.user.id
      });
    }

    if (req.user.role === "agency") {
      ownerType = "Agency";

      ownerProfile = await Agency.findOne({
        userId: req.user.id
      });
    }

    if (!ownerProfile) {
      return res.status(404).json({
        success: false,
        message: "Owner or agency profile not found"
      });
    }

    const vehicles = await Vehicle.find({
      ownerType,
      ownerId: ownerProfile._id
    });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles
    });

  } catch (error) {
    console.error("Get My Vehicles Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// VERIFY VEHICLE
// ==============================
const verifyVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(
      req.params.id
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    vehicle.verificationStatus = "verified";

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Vehicle verified successfully",
      vehicle
    });

  } catch (error) {
    console.error("Verify Vehicle Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// REJECT VEHICLE
// ==============================
const rejectVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(
      req.params.id
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    vehicle.verificationStatus = "rejected";

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Vehicle verification rejected",
      vehicle
    });

  } catch (error) {
    console.error("Reject Vehicle Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


module.exports = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getMyVehicles,
  verifyVehicle,
  rejectVehicle
};