const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");
const Owner = require("../models/Owner");
const Agency = require("../models/Agency");
const Booking = require("../models/Booking");

// Default Gujarat city coordinates [longitude, latitude]
const CITY_COORDINATES = {
  surat: [72.8311, 21.1702],
  navsari: [72.9289, 20.9507],
  vadodara: [73.1812, 22.3072],
  ahmedabad: [72.5714, 23.0225],
  nadiad: [72.8634, 22.6916],
  kheda: [72.8634, 22.6916],
  anand: [72.9289, 22.5645],
  gandhinagar: [72.6369, 23.2156],
  rajkot: [70.8022, 22.3039],
  bharuch: [72.9959, 21.7051],
  bhavnagar: [72.1519, 21.7645],
  jamnagar: [70.0577, 22.4707],
  junagadh: [70.4579, 21.5222],
  valsad: [72.9289, 20.5992]
};

const getCoordsForCity = (cityName) => {
  if (!cityName) return [72.8311, 21.1702];
  const normalized = cityName.toLowerCase().trim();
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (normalized.includes(key)) return coords;
  }
  return [72.8311, 21.1702];
};

// Find the vehicle owner using the lowercase ownerType values.
const getVehicleOwner = async (vehicle) => {
  const ownerType = vehicle.ownerType || "owner";
  const ownerId =
    vehicle.ownerId ||
    vehicle.ownerid ||
    (vehicle._doc && vehicle._doc.ownerid);

  if (!ownerId) {
    return null;
  }

  if (ownerType === "owner") {
    return Owner.findById(ownerId)
      .select("name email phone city");
  }

  if (ownerType === "agency") {
    return Agency.findById(ownerId)
      .select("agencyName ownerName email phone city");
  }

  return null;
};

// Attach owner details without using refPath populate
const addOwnerDetails = async (vehicle) => {
  const owner = await getVehicleOwner(vehicle);
  const vehicleObj = vehicle.toObject ? vehicle.toObject() : { ...vehicle };

  // Harmonize price / pricePerDay for backward compatibility
  const priceValue =
    vehicleObj.pricePerDay ??
    vehicleObj.price ??
    (vehicle._doc && vehicle._doc.price);

  if (priceValue !== undefined) {
    vehicleObj.pricePerDay = priceValue;
    vehicleObj.price = priceValue;
  }

  // Fallback for city if missing on legacy vehicle
  if (!vehicleObj.city && owner?.city) {
    vehicleObj.city = owner.city;
  }

  return {
    ...vehicleObj,
    owner
  };
};

// CREATE VEHICLE
const createVehicle = async (req, res) => {
  try {
    const {
      vehicleid,
      brand,
      model,
      type,
      pricePerDay,
      city,
      year,
      registrationNumber,
      imageUrl,
      description,
      latitude,
      longitude,
      pickupLocationAddress,
      returnLocationAddress
    } = req.body;

    if (
      !brand ||
      !type ||
      pricePerDay === undefined ||
      pricePerDay === "" ||
      !city
    ) {
      return res.status(400).json({
        success: false,
        message: "Vehicle name/brand, type, price per day, and city are required fields."
      });
    }

    const price = Number(pricePerDay);
    const vehicleYear = year ? Number(year) : new Date().getFullYear();
    const finalVehicleId = vehicleid && String(vehicleid).trim() ? String(vehicleid).trim() : ("VEH-" + Date.now().toString().slice(-6));

    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price per day must be a valid non-negative number"
      });
    }

    if (
      !Number.isInteger(vehicleYear) ||
      vehicleYear < 1900
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid vehicle year"
      });
    }

    let ownerType = req.user.role === "owner" ? "owner" : "agency";
    let ownerProfile;

    if (req.user.role === "agency") {
      ownerProfile = await Agency.findOne({
        userId: req.user.id
      });
    } else if (req.user.role === "owner") {
      ownerProfile = await Owner.findOne({
        userId: req.user.id
      });
    } else if (req.user.role === "admin") {
      ownerProfile = (await Agency.findOne()) || (await Owner.findOne());
    } else {
      return res.status(403).json({
        success: false,
        message: "Only registered owners and agencies can add vehicles to the platform"
      });
    }

    if (!ownerProfile) {
      return res.status(404).json({
        success: false,
        message: `${ownerType === "owner" ? "Host" : "Agency"} profile not found. Please complete profile registration.`
      });
    }

    const existingVehicle = await Vehicle.findOne({
      vehicleid: finalVehicleId
    });

    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: "Vehicle ID already exists"
      });
    }

    let finalImageUrl = imageUrl || "";
    if (req.file) {
      finalImageUrl = `/uploads/vehicles/${req.file.filename}`;
    }

    // Determine geographic coordinates [longitude, latitude]
    const defaultCoords = getCoordsForCity(city);
    const finalLng = longitude !== undefined && !isNaN(Number(longitude)) ? Number(longitude) : defaultCoords[0];
    const finalLat = latitude !== undefined && !isNaN(Number(latitude)) ? Number(latitude) : defaultCoords[1];

    const vehicle = await Vehicle.create({
      vehicleid: finalVehicleId,
      ownerType,
      ownerId: ownerProfile._id,
      brand,
      model,
      type,
      pricePerDay: price,
      city,
      year: vehicleYear,
      registrationNumber,
      imageUrl: finalImageUrl,
      description,
      location: {
        type: "Point",
        coordinates: [finalLng, finalLat]
      },
      latitude: finalLat,
      longitude: finalLng,
      pickupLocationAddress: pickupLocationAddress || `${city}, Gujarat`,
      returnLocationAddress: returnLocationAddress || `${city}, Gujarat`,
      status: "available",
      verificationStatus: "pending"
    });

    // Send role-based notifications
    try {
      const { sendNotification, sendRoleNotification } = require("../utils/notificationService");
      
      // 1. Host notification
      await sendNotification({
        userId: req.user.id,
        role: ownerType,
        type: "vehicle_submitted",
        title: "Vehicle Listing Submitted",
        message: `Your vehicle ${brand} ${model} (${finalVehicleId}) has been listed and is pending administrator verification.`,
        link: ownerType === "agency" ? "/agency/dashboard" : "/owner/dashboard"
      });

      // 2. Admin notification
      await sendRoleNotification("admin", {
        type: "vehicle_submitted",
        title: "New Vehicle Listing Pending",
        message: `Host ${ownerProfile.name || ownerProfile.agencyName || "Host"} submitted a new ${type}: ${brand} ${model} in ${city}.`,
        link: "/admin/dashboard"
      });
    } catch (nErr) {
      console.warn("Vehicle creation notification error:", nErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      vehicle: await addOwnerDetails(vehicle)
    });
  } catch (error) {
    console.error("Create Vehicle Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Vehicle ID already exists"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET ALL VEHICLES
// PUBLIC SEARCH & LOCATION FILTER
const getAllVehicles = async (req, res) => {
  try {
    const { type, city, location, search, minPrice, maxPrice } = req.query;

    const filter = {
      status: "available"
    };

    if (req.query.verificationStatus) {
      filter.verificationStatus = req.query.verificationStatus;
    } else {
      filter.$or = [
        { verificationStatus: "verified" },
        { verificationStatus: { $exists: false } }
      ];
    }

    if (type && type !== "All") {
      filter.type = type;
    }

    const targetLocation = (location || city || "").trim();
    if (targetLocation && targetLocation !== "All") {
      const safeLocation = targetLocation.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.city = {
        $regex: safeLocation,
        $options: "i"
      };
    }

    if (search && search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = { $regex: safeSearch, $options: "i" };
      
      const searchConditions = [
        { brand: searchRegex },
        { model: searchRegex },
        { city: searchRegex },
        { type: searchRegex },
        { registrationNumber: searchRegex },
        { description: searchRegex }
      ];

      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: searchConditions }
        ];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const min =
        minPrice === undefined ? undefined : Number(minPrice);
      const max =
        maxPrice === undefined ? undefined : Number(maxPrice);

      if (
        (min !== undefined && (!Number.isFinite(min) || min < 0)) ||
        (max !== undefined && (!Number.isFinite(max) || max < 0)) ||
        (min !== undefined && max !== undefined && min > max)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid price range"
        });
      }

      filter.pricePerDay = {};

      if (min !== undefined) {
        filter.pricePerDay.$gte = min;
      }

      if (max !== undefined) {
        filter.pricePerDay.$lte = max;
      }
    }

    const vehicles = await Vehicle.find(filter)
      .sort({ createdAt: -1 });

    const vehiclesWithOwners = await Promise.all(
      vehicles.map(addOwnerDetails)
    );

    return res.status(200).json({
      success: true,
      count: vehiclesWithOwners.length,
      vehicles: vehiclesWithOwners
    });
  } catch (error) {
    console.error("Get Vehicles Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET VEHICLE BY ID
const getVehicleById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID"
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    if (
      vehicle.status !== "available" ||
      (vehicle.verificationStatus && vehicle.verificationStatus === "rejected")
    ) {
      return res.status(404).json({
        success: false,
        message: "Vehicle is not available"
      });
    }

    return res.status(200).json({
      success: true,
      vehicle: await addOwnerDetails(vehicle)
    });
  } catch (error) {
    console.error("Get Vehicle Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// CHECK VEHICLE ACCESS
const checkVehicleAccess = async (vehicle, user) => {
  if (user.role === "admin") {
    return true;
  }

  let ownerType;
  let profile;

  if (user.role === "owner") {
    ownerType = "owner";
    profile = await Owner.findOne({
      userId: user.id
    });
  } else if (user.role === "agency") {
    ownerType = "agency";
    profile = await Agency.findOne({
      userId: user.id
    });
  } else {
    return false;
  }

  if (!profile) {
    return false;
  }

  return (
    vehicle.ownerType === ownerType &&
    vehicle.ownerId.toString() === profile._id.toString()
  );
};

// UPDATE VEHICLE
const updateVehicle = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID"
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    const hasAccess = await checkVehicleAccess(
      vehicle,
      req.user
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You can update only your own vehicle"
      });
    }

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

    if (
      req.user.role !== "admin" &&
      status !== undefined
    ) {
      return res.status(403).json({
        success: false,
        message: "Vehicle status is managed by the system"
      });
    }

    if (
      req.user.role !== "admin" &&
      req.body.verificationStatus !== undefined
    ) {
      return res.status(403).json({
        success: false,
        message: "Only admins can change verification status"
      });
    }

    if (pricePerDay !== undefined) {
      const price = Number(pricePerDay);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a valid non-negative number"
        });
      }

      vehicle.pricePerDay = price;
    }

    if (year !== undefined) {
      const vehicleYear = Number(year);

      if (
        !Number.isInteger(vehicleYear) ||
        vehicleYear < 1900
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid vehicle year"
        });
      }

      vehicle.year = vehicleYear;
    }

    if (brand !== undefined) vehicle.brand = brand;
    if (model !== undefined) vehicle.model = model;
    if (type !== undefined) vehicle.type = type;
    if (city !== undefined) vehicle.city = city;

    if (registrationNumber !== undefined) {
      vehicle.registrationNumber = registrationNumber;
    }

    if (req.file) {
      vehicle.imageUrl = `/uploads/vehicles/${req.file.filename}`;
    } else if (imageUrl !== undefined) {
      vehicle.imageUrl = imageUrl;
    }

    if (description !== undefined) {
      vehicle.description = description;
    }

    if (req.user.role === "admin" && status !== undefined) {
      vehicle.status = status;
    }

    await vehicle.save();

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      vehicle: await addOwnerDetails(vehicle)
    });
  } catch (error) {
    console.error("Update Vehicle Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// DELETE VEHICLE
const deleteVehicle = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID"
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    const hasAccess = await checkVehicleAccess(
      vehicle,
      req.user
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You can delete only your own vehicle"
      });
    }

    const activeBooking = await Booking.findOne({
      vehicleId: vehicle._id,
      status: {
        $in: ["pending", "confirmed", "ongoing"]
      }
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: "Vehicle cannot be deleted while it has active bookings"
      });
    }

    // Soft-deactivate as required by SRS 3.1.2.3
    vehicle.status = "inactive";
    await vehicle.save();

    return res.status(200).json({
      success: true,
      message: "Vehicle removed/deactivated successfully",
      vehicle
    });
  } catch (error) {
    console.error("Delete Vehicle Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET MY VEHICLES
const getMyVehicles = async (req, res) => {
  try {
    let ownerType;
    let ownerProfile;

    if (req.user.role === "owner") {
      ownerType = "owner";
      ownerProfile = await Owner.findOne({
        userId: req.user.id
      });
    } else if (req.user.role === "agency") {
      ownerType = "agency";
      ownerProfile = await Agency.findOne({
        userId: req.user.id
      });
    } else {
      return res.status(403).json({
        success: false,
        message: "Only owners and agencies can view their vehicles"
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
    }).sort({ createdAt: -1 });

    const vehiclesWithOwners = await Promise.all(
      vehicles.map(addOwnerDetails)
    );

    return res.status(200).json({
      success: true,
      count: vehiclesWithOwners.length,
      vehicles: vehiclesWithOwners
    });
  } catch (error) {
    console.error("Get My Vehicles Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// VERIFY VEHICLE
const verifyVehicle = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID"
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    vehicle.verificationStatus = "verified";
    await vehicle.save();

    return res.status(200).json({
      success: true,
      message: "Vehicle verified successfully",
      vehicle
    });
  } catch (error) {
    console.error("Verify Vehicle Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// REJECT VEHICLE
const rejectVehicle = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID"
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    vehicle.verificationStatus = "rejected";
    await vehicle.save();

    return res.status(200).json({
      success: true,
      message: "Vehicle verification rejected",
      vehicle
    });
  } catch (error) {
    console.error("Reject Vehicle Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET DISTINCT ACTIVE VEHICLE LOCATIONS
const getDistinctLocations = async (req, res) => {
  try {
    const rawCities = await Vehicle.distinct("city", {
      status: "available",
      $or: [
        { verificationStatus: "verified" },
        { verificationStatus: { $exists: false } }
      ]
    });

    const defaultCities = [
      "Ahmedabad",
      "Amreli",
      "Anand",
      "Aravalli",
      "Banaskantha",
      "Bharuch",
      "Bhavnagar",
      "Botad",
      "Chhota Udaipur",
      "Dahod",
      "Dang",
      "Devbhumi Dwarka",
      "Gandhinagar",
      "Gir Somnath",
      "Jamnagar",
      "Junagadh",
      "Kheda (Nadiad)",
      "Kutch (Bhuj)",
      "Mahisagar",
      "Mehsana",
      "Morbi",
      "Narmada",
      "Navsari",
      "Panchmahal (Godhra)",
      "Patan",
      "Porbandar",
      "Rajkot",
      "Sabarkantha (Himmatnagar)",
      "Surat",
      "Surendranagar",
      "Tapi (Vyara)",
      "Vadodara",
      "Valsad"
    ];
    const combined = Array.from(new Set([...(rawCities || []).filter(Boolean), ...defaultCities])).sort();

    return res.status(200).json({
      success: true,
      locations: combined
    });
  } catch (error) {
    console.error("Get Distinct Locations Error:", error);
    return res.status(200).json({
      success: true,
      locations: [
        "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch",
        "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhumi Dwarka",
        "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda (Nadiad)",
        "Kutch (Bhuj)", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari",
        "Panchmahal (Godhra)", "Patan", "Porbandar", "Rajkot", "Sabarkantha (Himmatnagar)",
        "Surat", "Surendranagar", "Tapi (Vyara)", "Vadodara", "Valsad"
      ]
    });
  }
};

// GET NEARBY VEHICLES (Spatial Query: GeoJSON 2dsphere $near with radius)
const getNearbyVehicles = async (req, res) => {
  try {
    const { lat, lng, radius = 5, type, maxPrice } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude (lat) and Longitude (lng) query parameters are required."
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius) || 5;
    const maxDistanceMeters = radiusKm * 1000;

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude coordinates."
      });
    }

    const filter = {
      status: "available"
    };

    if (req.query.verificationStatus) {
      filter.verificationStatus = req.query.verificationStatus;
    } else {
      filter.$or = [
        { verificationStatus: "verified" },
        { verificationStatus: { $exists: false } }
      ];
    }

    if (type && type !== "All") {
      filter.type = type;
    }

    if (maxPrice) {
      filter.pricePerDay = { $lte: Number(maxPrice) };
    }

    let vehicles = [];
    try {
      // Primary: High-speed MongoDB GeoJSON 2dsphere $near
      const geoFilter = {
        ...filter,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude] // GeoJSON [lng, lat]
            },
            $maxDistance: maxDistanceMeters
          }
        }
      };

      vehicles = await Vehicle.find(geoFilter).limit(50);
    } catch (geoErr) {
      console.warn("Geospatial index fallback calculation:", geoErr.message);
      // Fallback: Haversine distance matching
      const allAvailable = await Vehicle.find(filter).limit(100);
      const toRad = (val) => (val * Math.PI) / 180;

      vehicles = allAvailable.filter((v) => {
        const vLng = v.location?.coordinates?.[0] ?? v.longitude ?? getCoordsForCity(v.city)[0];
        const vLat = v.location?.coordinates?.[1] ?? v.latitude ?? getCoordsForCity(v.city)[1];
        const dLat = toRad(vLat - latitude);
        const dLon = toRad(vLng - longitude);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(latitude)) * Math.cos(toRad(vLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distKm = 6371 * c;
        return distKm <= radiusKm;
      });
    }

    const toRad = (val) => (val * Math.PI) / 180;

    const vehiclesWithOwners = await Promise.all(
      vehicles.map(async (v) => {
        const enriched = await addOwnerDetails(v);
        const obj = enriched.toObject ? enriched.toObject() : { ...enriched };
        const vLng = obj.location?.coordinates?.[0] ?? obj.longitude ?? getCoordsForCity(obj.city)[0];
        const vLat = obj.location?.coordinates?.[1] ?? obj.latitude ?? getCoordsForCity(obj.city)[1];
        if (vLat !== undefined && vLng !== undefined) {
          const dLat = toRad(vLat - latitude);
          const dLon = toRad(vLng - longitude);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(latitude)) * Math.cos(toRad(vLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          obj.distanceKm = Math.round(6371 * c * 10) / 10;
        }
        return obj;
      })
    );

    // Sort closest first
    vehiclesWithOwners.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

    return res.status(200).json({
      success: true,
      count: vehiclesWithOwners.length,
      radiusKm,
      userLocation: { latitude, longitude },
      vehicles: vehiclesWithOwners
    });
  } catch (error) {
    console.error("Get Nearby Vehicles Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error searching nearby vehicles",
      error: error.message
    });
  }
};

module.exports = {
  createVehicle,
  getAllVehicles,
  getNearbyVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getMyVehicles,
  verifyVehicle,
  rejectVehicle,
  getDistinctLocations
};