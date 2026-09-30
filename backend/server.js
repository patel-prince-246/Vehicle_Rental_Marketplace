const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Load environment variables
dotenv.config();

// Database
const connectDB = require("./config/db");

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: "*"
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

app.use(limiter);

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Vehicle Rental Marketplace API is running"
  });
});

// API routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/owners", require("./routes/ownerRoutes"));
app.use("/api/agencies", require("./routes/agencyRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/vehicles", require("./routes/vehicleRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// 404 handler
app.use(require("./middleware/errorMiddleware").notFound);

// Global error handler
app.use(require("./middleware/errorMiddleware").errorHandler);

// Start server after database connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

