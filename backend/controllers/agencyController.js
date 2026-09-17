const Agency = require("../models/Agency");
const User = require("../models/User");


// ==============================
// GET AGENCY PROFILE
// ==============================
const getAgencyProfile = async (req, res) => {
  try {
    const agency = await Agency.findOne({
      userId: req.user.id
    }).populate("userId", "-password");

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency profile not found"
      });
    }

    res.status(200).json({
      success: true,
      agency
    });

  } catch (error) {
    console.error("Get Agency Profile Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// UPDATE AGENCY PROFILE
// ==============================
const updateAgencyProfile = async (req, res) => {
  try {
    const {
      agencyName,
      ownerName,
      phone,
      city,
      address,
      registrationNumber
    } = req.body;

    const agency = await Agency.findOne({
      userId: req.user.id
    });

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency profile not found"
      });
    }

    if (agencyName !== undefined) {
      agency.agencyName = agencyName;
    }

    if (ownerName !== undefined) {
      agency.ownerName = ownerName;
    }

    if (phone !== undefined) {
      agency.phone = phone;
    }

    if (city !== undefined) {
      agency.city = city;
    }

    if (address !== undefined) {
      agency.address = address;
    }

    if (registrationNumber !== undefined) {
      agency.registrationNumber = registrationNumber;
    }

    await agency.save();


    // Update linked User
    const user = await User.findById(
      req.user.id
    );

    if (user) {
      if (ownerName !== undefined) {
        user.name = ownerName;
      }

      if (phone !== undefined) {
        user.phone = phone;
      }

      if (city !== undefined) {
        user.city = city;
      }

      await user.save();
    }


    res.status(200).json({
      success: true,
      message: "Agency profile updated successfully",
      agency
    });

  } catch (error) {
    console.error("Update Agency Profile Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET ALL AGENCIES
// ==============================
const getAllAgencies = async (req, res) => {
  try {
    const agencies = await Agency.find()
      .populate("userId", "-password");

    res.status(200).json({
      success: true,
      count: agencies.length,
      agencies
    });

  } catch (error) {
    console.error("Get All Agencies Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET AGENCY BY ID
// ==============================
const getAgencyById = async (req, res) => {
  try {
    const agency = await Agency.findById(
      req.params.id
    ).populate("userId", "-password");

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found"
      });
    }

    res.status(200).json({
      success: true,
      agency
    });

  } catch (error) {
    console.error("Get Agency Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// VERIFY AGENCY BY ADMIN
// ==============================
const verifyAgency = async (req, res) => {
  try {
    const agency = await Agency.findById(
      req.params.id
    );

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found"
      });
    }

    agency.isVerified = true;

    await agency.save();

    res.status(200).json({
      success: true,
      message: "Agency verified successfully",
      agency
    });

  } catch (error) {
    console.error("Verify Agency Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// REJECT AGENCY BY ADMIN
// ==============================
const rejectAgency = async (req, res) => {
  try {
    const agency = await Agency.findById(
      req.params.id
    );

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found"
      });
    }

    agency.isVerified = false;

    await agency.save();

    res.status(200).json({
      success: true,
      message: "Agency verification rejected",
      agency
    });

  } catch (error) {
    console.error("Reject Agency Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// DELETE AGENCY
// ==============================
const deleteAgency = async (req, res) => {
  try {
    const agency = await Agency.findById(
      req.params.id
    );

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found"
      });
    }

    // Delete Agency profile
    await Agency.findByIdAndDelete(
      req.params.id
    );

    // Delete linked User
    await User.findByIdAndDelete(
      agency.userId
    );

    res.status(200).json({
      success: true,
      message: "Agency deleted successfully"
    });

  } catch (error) {
    console.error("Delete Agency Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


module.exports = {
  getAgencyProfile,
  updateAgencyProfile,
  getAllAgencies,
  getAgencyById,
  verifyAgency,
  rejectAgency,
  deleteAgency
};