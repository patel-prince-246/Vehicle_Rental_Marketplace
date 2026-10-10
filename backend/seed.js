const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/User");
const Owner = require("./models/Owner");
const Agency = require("./models/Agency");
const Admin = require("./models/Admin");
const Vehicle = require("./models/Vehicle");
const Booking = require("./models/Booking");
const Payment = require("./models/Payment");
const Review = require("./models/Review");
const Notification = require("./models/Notification");

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing collections
    await User.deleteMany({});
    await Owner.deleteMany({});
    await Agency.deleteMany({});
    await Admin.deleteMany({});
    await Vehicle.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Review.deleteMany({});
    await Notification.deleteMany({});

    console.log("Cleared existing data.");

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash("tapan123", salt);
    const agencyPassword = await bcrypt.hash("agency123", salt);
    const ownerPassword = await bcrypt.hash("prince123", salt);
    const customerPassword = await bcrypt.hash("dhruv123", salt);

    // 1. Create Admin: Tapan (Single Master Platform Admin)
    const adminUser = await User.create({
      userid: "USR-ADM-001",
      name: "Tapan",
      email: "tapan@admin.com",
      phone: "9327102008",
      password: adminPassword,
      city: "Nadiad",
      role: "admin",
      isActive: true
    });

    await Admin.create({
      adminid: "ADM001",
      userId: adminUser._id,
      name: "Tapan",
      email: "tapan@admin.com",
      phone: "9327102008",
      isActive: true
    });

    console.log("Created Admin: Tapan (tapan@admin.com / tapan123)");

    // 2. Create Agency: Gujarat Fleet Agency (Single Master Commercial Agency)
    const agencyUser = await User.create({
      userid: "USR-AGC-001",
      name: "Gujarat Commercial Travels",
      email: "agency@agency.com",
      phone: "9876500000",
      password: agencyPassword,
      city: "Ahmedabad",
      role: "agency",
      isActive: true
    });

    const agencyProfile = await Agency.create({
      agencyid: "AGC001",
      userId: agencyUser._id,
      agencyName: "Gujarat Commercial Travels",
      ownerName: "Hitesh Patel",
      email: "agency@agency.com",
      phone: "9876500000",
      city: "Ahmedabad",
      address: "Near SG Highway, Ahmedabad, Gujarat",
      registrationNumber: "GJ-AGC-2024-8899",
      isVerified: true
    });

    console.log("Created Agency: Gujarat Travels (agency@agency.com / agency123)");

    // 3. Create Owner: Prince (Peer-to-Peer Car Host)
    const ownerUser = await User.create({
      userid: "USR-OWN-001",
      name: "Prince",
      email: "prince@owner.com",
      phone: "9876543210",
      password: ownerPassword,
      city: "Vadodara",
      role: "owner",
      isActive: true
    });

    const ownerProfile = await Owner.create({
      ownerid: "OWN001",
      userId: ownerUser._id,
      name: "Prince",
      email: "prince@owner.com",
      phone: "9876543210",
      city: "Vadodara",
      isVerified: true
    });

    console.log("Created Owner: Prince (prince@owner.com / prince123)");

    // 4. Create Customer: Dhruv
    const customerUser = await User.create({
      userid: "USR-CUST-001",
      name: "Dhruv",
      email: "dhruv@gmail.com",
      phone: "9876456342",
      password: customerPassword,
      city: "Nadiad",
      role: "customer",
      license: {
        licenseNumber: "GJ072023001234",
        status: "verified"
      },
      isActive: true
    });

    console.log("Created Customer: Dhruv (dhruv@gmail.com / dhruv123)");

    // 5. Create Vehicles

    const vehiclesData = [
      {
        vehicleid: "GJ07AC4554",
        ownerType: "owner",
        ownerId: ownerProfile._id,
        brand: "Honda",
        model: "Activa 6G",
        type: "Scooter",
        pricePerDay: 450,
        price: 450,
        city: "Nadiad",
        year: 2024,
        registrationNumber: "GJ07AC4554",
        status: "available",
        verificationStatus: "verified",
        imageUrl: "https://images.unsplash.com/photo-1591768575198-88dac53fbd0a?w=800&auto=format&fit=crop&q=80",
        description: "Smooth and fuel-efficient scooter, perfect for city commutes and errands."
      },
      {
        vehicleid: "GJ06RE3500",
        ownerType: "owner",
        ownerId: ownerProfile._id,
        brand: "Royal Enfield",
        model: "Classic 350",
        type: "Bike",
        pricePerDay: 950,
        price: 950,
        city: "Vadodara",
        year: 2023,
        registrationNumber: "GJ06RE3500",
        status: "available",
        verificationStatus: "verified",
        imageUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80",
        description: "Iconic cruiser motorcycle with powerful thump, ideal for highway touring."
      },
      {
        vehicleid: "GJ01HC1800",
        ownerType: "owner",
        ownerId: ownerProfile._id,
        brand: "Honda",
        model: "City ZX",
        type: "Car",
        pricePerDay: 1900,
        price: 1900,
        city: "Ahmedabad",
        year: 2023,
        registrationNumber: "GJ01HC1800",
        status: "available",
        verificationStatus: "verified",
        imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
        description: "Premium sedan with sunroof, spacious cabin, and automatic transmission."
      },
      {
        vehicleid: "GJ06CR2500",
        ownerType: "owner",
        ownerId: ownerProfile._id,
        brand: "Hyundai",
        model: "Creta SX",
        type: "SUV",
        pricePerDay: 2600,
        price: 2600,
        city: "Vadodara",
        year: 2024,
        registrationNumber: "GJ06CR2500",
        status: "available",
        verificationStatus: "verified",
        imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80",
        description: "Spacious 5-seater SUV, packed with modern tech and high ground clearance."
      },
      {
        vehicleid: "GJ07TH4400",
        ownerType: "owner",
        ownerId: ownerProfile._id,
        brand: "Mahindra",
        model: "Thar 4x4",
        type: "SUV",
        pricePerDay: 3200,
        price: 3200,
        city: "Nadiad",
        year: 2023,
        registrationNumber: "GJ07TH4400",
        status: "available",
        verificationStatus: "verified",
        imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80",
        description: "Legendary off-road SUV with convertible hardtop and rugged 4WD capabilities."
      },
      {
        vehicleid: "GJ01YR1500",
        ownerType: "owner",
        ownerId: ownerProfile._id,
        brand: "Yamaha",
        model: "YZF R15 V4",
        type: "Bike",
        pricePerDay: 1100,
        price: 1100,
        city: "Ahmedabad",
        year: 2024,
        registrationNumber: "GJ01YR1500",
        status: "available",
        verificationStatus: "verified",
        imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80",
        description: "Aggressive aerodynamic sportbike, quick throttle response and dual-channel ABS."
      },
      // Agency Commercial Fleet Vehicles
      {
        vehicleid: "GJ01IN7788",
        ownerType: "agency",
        ownerId: agencyProfile._id,
        brand: "Toyota",
        model: "Innova Crysta",
        type: "SUV",
        pricePerDay: 3500,
        price: 3500,
        city: "Ahmedabad",
        year: 2024,
        registrationNumber: "GJ01IN7788",
        status: "available",
        verificationStatus: "verified",
        imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
        description: "Commercial 7-seater MPV with premium captain seats, ideal for corporate and long tours."
      },
      {
        vehicleid: "GJ01FT9900",
        ownerType: "agency",
        ownerId: agencyProfile._id,
        brand: "Force",
        model: "Urbania Luxury Van",
        type: "Van",
        pricePerDay: 5500,
        price: 5500,
        city: "Ahmedabad",
        year: 2024,
        registrationNumber: "GJ01FT9900",
        status: "available",
        verificationStatus: "verified",
        imageUrl: "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=800&auto=format&fit=crop&q=80",
        description: "Luxury executive group travel van with recliner seating, AC, and high-speed WiFi."
      },
      // Surat & Navsari Vehicles for Realtime Location & 5km Instant Booking
      {
        vehicleid: "GJ05ST2024",
        ownerType: "owner",
        ownerId: ownerProfile._id,
        brand: "Maruti Suzuki",
        model: "Swift ZXi",
        type: "Car",
        pricePerDay: 1400,
        price: 1400,
        city: "Surat",
        year: 2024,
        registrationNumber: "GJ05ST2024",
        status: "available",
        verificationStatus: "verified",
        imageUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80",
        description: "Agile hatchback, perfect for quick drives in Surat city and highway runs."
      },
      {
        vehicleid: "GJ05NV1122",
        ownerType: "agency",
        ownerId: agencyProfile._id,
        brand: "Tata",
        model: "Nexon EV",
        type: "SUV",
        pricePerDay: 2200,
        price: 2200,
        city: "Navsari",
        year: 2024,
        registrationNumber: "GJ05NV1122",
        status: "available",
        verificationStatus: "verified",
        imageUrl: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80",
        description: "Electric SUV in Navsari with 400km range, zero emission and instant acceleration."
      }
    ];

    const CITY_COORDS = {
      surat: [72.8311, 21.1702],
      navsari: [72.9289, 20.9507],
      vadodara: [73.1812, 22.3072],
      ahmedabad: [72.5714, 23.0225],
      nadiad: [72.8634, 22.6916]
    };

    const enrichedVehicles = vehiclesData.map((v) => {
      const cityKey = (v.city || "").toLowerCase().trim();
      const coords = CITY_COORDS[cityKey] || [72.8311, 21.1702];
      return {
        ...v,
        location: {
          type: "Point",
          coordinates: coords
        },
        latitude: coords[1],
        longitude: coords[0],
        pickupLocationAddress: `${v.city}, Gujarat`,
        returnLocationAddress: `${v.city}, Gujarat`
      };
    });

    const insertedVehicles = await Vehicle.insertMany(enrichedVehicles);
    console.log(`Created ${insertedVehicles.length} vehicles.`);

    console.log("\n============================================");
    console.log("DATABASE SEEDING SUCCESSFUL!");
    console.log("============================================");
    console.log("Master Credentials:");
    console.log("Admin:    Tapan          -> email: tapan@admin.com   | password: tapan123");
    console.log("Agency:   Gujarat Travels -> email: agency@agency.com | password: agency123");
    console.log("Owner:    Prince         -> email: prince@owner.com  | password: prince123");
    console.log("Customer: Dhruv          -> email: dhruv@gmail.com   | password: dhruv123");
    console.log("============================================\n");


    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedDatabase();
