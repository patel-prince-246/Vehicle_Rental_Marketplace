const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Database
const connectDB = require("./config/db");

// Error middleware
const {
  notFound,
  errorHandler
} = require("./middleware/errorMiddleware");


// ==============================
// LOAD ENVIRONMENT VARIABLES
// ==============================
dotenv.config();


// ==============================
// CONNECT DATABASE
// ==============================
connectDB();


// ==============================
// CREATE EXPRESS APP
// ==============================
const app = express();


// ==============================
// SECURITY MIDDLEWARE
// ==============================
app.use(helmet());


// ==============================
// CORS
// ==============================
app.use(
  cors({
    origin: "*"
  })
);


// ==============================
// JSON BODY PARSER
// ==============================
app.use(express.json());


// ==============================
// URL ENCODED DATA
// ==============================
app.use(express.urlencoded({
  extended: true
}));


// ==============================
// RATE LIMITING
// ==============================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

app.use(limiter);


// ==============================
// ROOT ROUTE
// ==============================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Vehicle Rental Marketplace API is running"
  });
});


// ==============================
// API ROUTES
// ==============================

app.use(
  "/api/users",
  require("./routes/userRoutes")
);

app.use(
  "/api/owners",
  require("./routes/ownerRoutes")
);

app.use(
  "/api/agencies",
  require("./routes/agencyRoutes")
);

app.use(
  "/api/admin",
  require("./routes/adminRoutes")
);

app.use(
  "/api/vehicles",
  require("./routes/vehicleRoutes")
);

app.use(
  "/api/bookings",
  require("./routes/bookingRoutes")
);

app.use(
  "/api/payments",
  require("./routes/paymentRoutes")
);

app.use(
  "/api/reviews",
  require("./routes/reviewRoutes")
);

app.use(
  "/api/notifications",
  require("./routes/notificationRoutes")
);


// ==============================
// 404 HANDLER
// ==============================
app.use(notFound);


// ==============================
// GLOBAL ERROR HANDLER
// ==============================
app.use(errorHandler);


// ==============================
// START SERVER
// ==============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});