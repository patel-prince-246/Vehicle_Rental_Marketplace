// ==============================
// NOT FOUND ERROR HANDLER
// ==============================
const notFound = (req, res, next) => {
  const error = new Error(
    `Route not found: ${req.originalUrl}`
  );

  res.status(404);

  next(error);
};


// ==============================
// GLOBAL ERROR HANDLER
// ==============================
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);

  const statusCode =
    res.statusCode && res.statusCode !== 200
      ? res.statusCode
      : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",

    // Show stack only during development
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack
    })
  });
};


module.exports = {
  notFound,
  errorHandler
};