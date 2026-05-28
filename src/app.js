const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./configs/mongodb.config");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const { errorHandler } = require("./middlewares/error.handler");

const app = express();

// Connect to MongoDB
connectDB();

// middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Authentication routes
app.use("/api/v1/auth", authRoutes);

// User routes (protected)
app.use("/api/v1/user", userRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
