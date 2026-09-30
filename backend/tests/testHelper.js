const mongoose = require("mongoose");
const connectDB = require("../config/db");

const initTestDB = async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test_jwt_secret_123";

  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
};

module.exports = { initTestDB };










