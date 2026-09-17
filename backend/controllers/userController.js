const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Owner = require("../models/Owner");
const Agency = require("../models/Agency");


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


    // ------------------------------
    // CHECK EXISTING EMAIL
    // ------------------------------
    const existingUser = await User.findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }


    // ------------------------------
    // HASH PASSWORD
    // ------------------------------
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );


    // ------------------------------
    // CREATE USER
    // ------------------------------
    const user = await User.create({
      userid,
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      city,
      role: userRole,
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
// LOGIN USER
// ==============================
const loginUser = async (req, res) => {
  try {

    const {
      email,
      password
    } = req.body;


    // ------------------------------
    // VALIDATION
    // ------------------------------
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required"
      });
    }


    // ------------------------------
    // FIND USER
    // ------------------------------
    const user = await User.findOne({
      email: email.toLowerCase()
    });


    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }


    // ------------------------------
    // CHECK ACTIVE USER
    // ------------------------------
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive"
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
        message: "Invalid email or password"
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

    console.error(
      "Get Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};