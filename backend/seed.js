const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/User");
const Owner = require("./models/Owner");
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
    const ownerPassword = await bcrypt.hash("prince123", salt);
    const customerPassword = await bcrypt.hash("dhruv123", salt);

    // 1. Create Admin: Tapan
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

    // 2. Create Owner: Prince
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

    // 3. Create Customer: Dhruv
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

    // 4. Create Vehicles for Owner Prince
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
        imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80",
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
      }
    ];

    const insertedVehicles = await Vehicle.insertMany(vehiclesData);
    console.log(`Created ${insertedVehicles.length} vehicles.`);

    console.log("\n============================================");
    console.log("DATABASE SEEDING SUCCESSFUL!");
    console.log("============================================");
    console.log("Credentials:");
    console.log("Admin:    Tapan  -> email: tapan@admin.com   | password: tapan123");
    console.log("Owner:    Prince -> email: prince@owner.com  | password: prince123");
    console.log("Customer: Dhruv  -> email: dhruv@gmail.com   | password: dhruv123");
    console.log("============================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedDatabase();
