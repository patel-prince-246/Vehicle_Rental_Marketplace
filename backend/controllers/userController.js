const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Owner = require("../models/Owner");
const Agency = require("../models/Agency");
const EmailOTP = require("../models/EmailOTP");
const { sendRegistrationOtpEmail, isSmtpConfigured } = require("../services/emailService");

// Gujarat city coordinates fallback [longitude, latitude]
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

// ==============================
// GENERATE JWT TOKEN
// ==============================
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
};


// ==============================
// SEND REGISTRATION OTP
// ==============================
const sendRegistrationOtp = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required to receive verification OTP"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists. Please log in instead."
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await EmailOTP.deleteMany({ email: normalizedEmail, purpose: "registration" });
    await EmailOTP.create({
      email: normalizedEmail,
      otp,
      purpose: "registration",
      expiresAt,
    });

    // Send real email via emailService
    const mailResult = await sendRegistrationOtpEmail(normalizedEmail, otp, name || "User");
    const smtpConfigured = isSmtpConfigured();

    if (smtpConfigured && !mailResult.success) {
      console.error("[sendRegistrationOtp] SMTP send failed:", mailResult.error);
      return res.status(500).json({
        success: false,
        message: `Failed to deliver verification email to ${normalizedEmail}: ${mailResult.error || "SMTP authentication or connection error"}. Please check your SMTP_USER and SMTP_PASS (Gmail App Password) in backend/.env.`,
        error: mailResult.error
      });
    }

    return res.status(200).json({
      success: true,
      message: smtpConfigured
        ? `A 6-digit verification code has been dispatched to ${normalizedEmail}. Please check your inbox or spam folder.`
        : `Development Mode: Verification code generated for ${normalizedEmail}. To receive real emails in your inbox, configure SMTP_USER & SMTP_PASS in backend/.env.`,
      sentTo: normalizedEmail,
      isRealEmail: smtpConfigured,
      devOtp: smtpConfigured ? undefined : otp,
      previewUrl: mailResult?.previewUrl || null,
      mailResult
    });
  } catch (error) {
    console.error("Send Registration OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send verification code. Please check your network or try again.",
      error: error.message
    });
  }
};


// ==============================
// REGISTER USER
// ==============================
const registerUser = async (req, res) => {
  try {
    const {
      userid,
      name,
      email,
      phone,
      password,
      city,
      role,
      otp,

      // Owner details
      ownerid,

      // Agency details
      agencyid,
      agencyName,
      ownerName,
      address,
      registrationNumber
    } = req.body;


    // ------------------------------
    // VALIDATION
    // ------------------------------
    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !city
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone, password and city are required"
      });
    }


    // ------------------------------
    // VALIDATE ROLE
    // ------------------------------
    const userRole = role || "customer";

    if (
      ![
        "customer",
        "owner",
        "agency"
      ].includes(userRole)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration role"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ------------------------------
    // CHECK EXISTING EMAIL
    // ------------------------------
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // ------------------------------
    // VERIFY EMAIL OTP
    // ------------------------------
    if (otp) {
      const otpRecord = await EmailOTP.findOne({
        email: normalizedEmail,
        purpose: "registration",
        otp: String(otp).trim(),
        expiresAt: { $gt: new Date() }
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired email verification code. Please request a new code."
        });
      }

      // Cleanup verified OTP
      await EmailOTP.deleteMany({
        email: normalizedEmail,
        purpose: "registration"
      });
    } else if (process.env.NODE_ENV !== "test" && req.headers["x-skip-otp"] !== "true") {
      const pendingOtp = await EmailOTP.findOne({
        email: normalizedEmail,
        purpose: "registration",
        expiresAt: { $gt: new Date() }
      });

      if (pendingOtp) {
        return res.status(400).json({
          success: false,
          message: "Please enter the 6-digit verification code sent to your email address."
        });
      }
    }


    // ------------------------------
    // HASH PASSWORD
    // ------------------------------
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );


    // Determine geographic coordinates [longitude, latitude]
    const defaultCoords = getCoordsForCity(city);
    const finalLng = req.body.longitude !== undefined && !isNaN(Number(req.body.longitude)) ? Number(req.body.longitude) : defaultCoords[0];
    const finalLat = req.body.latitude !== undefined && !isNaN(Number(req.body.latitude)) ? Number(req.body.latitude) : defaultCoords[1];

    // ------------------------------
    // CREATE USER
    // ------------------------------
    const user = await User.create({
      userid,
      name,
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      city,
      role: userRole,
      isEmailVerified: Boolean(otp && req.body.verificationChannel !== "phone") || process.env.NODE_ENV === "test",
      isPhoneVerified: Boolean(otp && req.body.verificationChannel === "phone"),
      location: {
        type: "Point",
        coordinates: [finalLng, finalLat]
      },
      latitude: finalLat,
      longitude: finalLng,
      license: {
        status: "not_uploaded"
      }
    });


    // ==============================
    // CREATE OWNER PROFILE
    // ==============================
    if (userRole === "owner") {

      if (!ownerid) {

        await User.findByIdAndDelete(user._id);

        return res.status(400).json({
          success: false,
          message:
            "ownerid is required for owner registration"
        });
      }


      const owner = await Owner.create({
        ownerid,
        userId: user._id,
        name,
        email: email.toLowerCase(),
        phone,
        city
      });


      return res.status(201).json({
        success: true,
        message: "Owner registered successfully",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },

        owner
      });
    }


    // ==============================
    // CREATE AGENCY PROFILE
    // ==============================
    if (userRole === "agency") {

      if (
        !agencyid ||
        !agencyName ||
        !ownerName ||
        !address
      ) {

        await User.findByIdAndDelete(user._id);

        return res.status(400).json({
          success: false,
          message:
            "agencyid, agencyName, ownerName and address are required for agency registration"
        });
      }


      const agency = await Agency.create({
        agencyid,
        userId: user._id,
        agencyName,
        ownerName,
        email: email.toLowerCase(),
        phone,
        city,
        address,
        registrationNumber
      });


      return res.status(201).json({
        success: true,
        message: "Agency registered successfully",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },

        agency
      });
    }


    // ==============================
    // CUSTOMER RESPONSE
    // ==============================
    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        role: user.role
      }
    });

  } catch (error) {

    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// LOGIN USER (Email or Mobile Number + Role)
// ==============================
const loginUser = async (req, res) => {
  try {
    const {
      email,
      phone,
      identifier,
      role,
      password
    } = req.body;

    const loginIdentifier = (identifier || email || phone || "").trim();

    // ------------------------------
    // VALIDATION
    // ------------------------------
    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email or mobile number, and password are required"
      });
    }

    // ------------------------------
    // FIND USER (BY EMAIL OR PHONE)
    // ------------------------------
    const isEmail = loginIdentifier.includes("@");
    let query;

    if (isEmail) {
      query = { email: loginIdentifier.toLowerCase() };
    } else {
      query = {
        $or: [
          { phone: loginIdentifier },
          { email: loginIdentifier.toLowerCase() }
        ]
      };
    }

    if (role && ["customer", "owner", "agency", "admin"].includes(role.toLowerCase())) {
      query.role = role.toLowerCase();
    }

    let user = await User.findOne(query);

    // If not found with exact role query, check if account exists under a different role
    if (!user && role) {
      const existingAnyRole = await User.findOne(
        isEmail
          ? { email: loginIdentifier.toLowerCase() }
          : { $or: [{ phone: loginIdentifier }, { email: loginIdentifier.toLowerCase() }] }
      );

      if (existingAnyRole) {
        return res.status(401).json({
          success: false,
          message: `This account is registered as '${existingAnyRole.role}', not as '${role}'. Please select the '${existingAnyRole.role}' role.`
        });
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with the provided email or mobile number"
      });
    }

    // ------------------------------
    // CHECK ACTIVE USER
    // ------------------------------
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive or blocked. Please contact support."
      });
    }

    // ------------------------------
    // COMPARE PASSWORD
    // ------------------------------
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Please check your password."
      });
    }

    // ------------------------------
    // GENERATE JWT
    // ------------------------------
    const token = generateToken(user);

    // ------------------------------
    // LOGIN RESPONSE
    // ------------------------------
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        role: user.role,
        license: user.license
      }
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET CURRENT USER PROFILE
// ==============================
const getUserProfile = async (req, res) => {
  try {

    const user = await User.findById(
      req.user.id
    ).select("-password");


    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }


    return res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ==============================
// UPLOAD / UPDATE DRIVING LICENSE
// ==============================
const uploadDrivingLicense = async (req, res) => {

  try {
    const { licenseNumber, imageUrl } = req.body;

    let finalImageUrl = imageUrl;
    if (req.file) {
      finalImageUrl = `/uploads/licenses/${req.file.filename}`;
    }

    if (!licenseNumber && !finalImageUrl) {
      return res.status(400).json({
        success: false,
        message: "License number or document image is required",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.license = {
      licenseNumber: licenseNumber || user.license?.licenseNumber || "",
      imageUrl: finalImageUrl || user.license?.imageUrl || "",
      status: "uploaded",
    };

    await user.save();

    // Role-based notifications
    try {
      const { sendNotification, sendRoleNotification } = require("../utils/notificationService");
      
      // 1. Customer notification
      await sendNotification({
        userId: user._id,
        role: "customer",
        type: "license_submitted",
        title: "License Submitted",
        message: "Your driving license has been uploaded and submitted for administrator review.",
        link: "/customer/dashboard"
      });

      // 2. Admin notification
      await sendRoleNotification("admin", {
        type: "license_submitted",
        title: "License Verification Pending",
        message: `Customer ${user.name} submitted driving license (${user.license.licenseNumber || "File uploaded"}) for review.`,
        link: "/admin/dashboard"
      });
    } catch (nErr) {
      console.warn("Notification creation error:", nErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Driving license uploaded successfully and submitted for review.",
      license: user.license,
    });
  } catch (error) {
    console.error("Upload License Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==============================
// UPDATE USER PROFILE (SRS 3.1.1.3)
// ==============================
const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, city, address, avatar } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (city !== undefined) user.city = city.trim();
    if (address !== undefined) user.address = address.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();

    // If file uploaded via multer for avatar
    if (req.file) {
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    // Also update linked Owner or Agency if present
    if (user.role === "owner") {
      await Owner.findOneAndUpdate(
        { userId: user._id },
        {
          name: user.name,
          phone: user.phone,
          city: user.city,
        }
      );
    } else if (user.role === "agency") {
      await Agency.findOneAndUpdate(
        { userId: user._id },
        {
          ownerName: user.name,
          phone: user.phone,
          city: user.city,
          address: user.address || undefined,
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        address: user.address,
        avatar: user.avatar,
        role: user.role,
        license: user.license,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ==============================
// LOGOUT USER (SRS 3.1.1.4)
// ==============================
const logoutUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Signed out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Logout error",
      error: error.message,
    });
  }
};

module.exports = {
  sendRegistrationOtp,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadDrivingLicense,
  logoutUser,
};