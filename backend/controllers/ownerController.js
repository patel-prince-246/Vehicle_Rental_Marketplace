const Owner = require("../models/Owner");
const User = require("../models/User");


// ==============================
// GET OWNER PROFILE
// ==============================
const getOwnerProfile = async (req, res) => {
  try {
    const owner = await Owner.findOne({
      userId: req.user.id
    }).populate("userId", "-password");

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner profile not found"
      });
    }

    res.status(200).json({
      success: true,
      owner
    });

  } catch (error) {
    console.error("Get Owner Profile Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// UPDATE OWNER PROFILE
// ==============================
const updateOwnerProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      city
    } = req.body;

    const owner = await Owner.findOne({
      userId: req.user.id
    });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner profile not found"
      });
    }

    // Update Owner
    if (name) owner.name = name;
    if (phone) owner.phone = phone;
    if (city) owner.city = city;

    await owner.save();

    // Update User information also
    const user = await User.findById(req.user.id);

    if (user) {
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (city) user.city = city;

      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Owner profile updated successfully",
      owner
    });

  } catch (error) {
    console.error("Update Owner Profile Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET ALL OWNERS
// ==============================
const getAllOwners = async (req, res) => {
  try {
    const owners = await Owner.find()
      .populate("userId", "-password");

    res.status(200).json({
      success: true,
      count: owners.length,
      owners
    });

  } catch (error) {
    console.error("Get All Owners Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// GET OWNER BY ID
// ==============================
const getOwnerById = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id)
      .populate("userId", "-password");

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found"
      });
    }

    res.status(200).json({
      success: true,
      owner
    });

  } catch (error) {
    console.error("Get Owner Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// UPDATE OWNER BY ADMIN
// ==============================
const updateOwnerByAdmin = async (req, res) => {
  try {
    const {
      name,
      phone,
      city,
      isVerified
    } = req.body;

    const owner = await Owner.findById(
      req.params.id
    );

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found"
      });
    }

    if (name !== undefined) {
      owner.name = name;
    }

    if (phone !== undefined) {
      owner.phone = phone;
    }

    if (city !== undefined) {
      owner.city = city;
    }

    if (isVerified !== undefined) {
      owner.isVerified = isVerified;
    }

    await owner.save();

    res.status(200).json({
      success: true,
      message: "Owner updated successfully",
      owner
    });

  } catch (error) {
    console.error("Update Owner Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ==============================
// DELETE OWNER
// ==============================
const deleteOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(
      req.params.id
    );

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found"
      });
    }

    // Delete owner profile
    await Owner.findByIdAndDelete(
      req.params.id
    );

    // Delete linked user account
    await User.findByIdAndDelete(
      owner.userId
    );

    res.status(200).json({
      success: true,
      message: "Owner deleted successfully"
    });

  } catch (error) {
    console.error("Delete Owner Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


module.exports = {
  getOwnerProfile,
  updateOwnerProfile,
  getAllOwners,
  getOwnerById,
  updateOwnerByAdmin,
  deleteOwner
};