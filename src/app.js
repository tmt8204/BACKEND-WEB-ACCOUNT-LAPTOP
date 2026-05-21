const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./configs/mongodb.config");
const authRoutes = require("./routes/auth.routes");
const { errorHandler } = require("./middlewares/error.handler");

const app = express();

// Connect to MongoDB
connectDB();

// middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Test route to verify server is running
app.get('/test', (req, res) => {
       res.status(200).json({ message: "Vercel đang chạy ngon lành!" });
   });

// Authentication routes
app.use("/api/v1/auth", authRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
