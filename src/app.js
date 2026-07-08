const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./configs/mongodb.config");
const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const productRoutes = require("./routes/product.route");
const cartRoutes = require("./routes/cart.route");
const orderRoutes = require("./routes/order.route");
const paymentRoutes = require("./routes/payment.route");
const inventoryRoutes = require("./routes/inventory.route");
const { errorHandler } = require("./middlewares/error.handler");
const supportRoutes = require("./routes/support.route");
const adminRoutes = require("./routes/admin.route");
const staffRoutes = require("./routes/staff.route");
const uploadRoutes = require("./routes/upload.route");
const bannerRoutes = require("./routes/banner.route");
const refundRoutes = require("./routes/refund.route");
const notificationRoutes = require("./routes/notification.route");

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

// Product routes
app.use("/api/v1/product", productRoutes);

// Cart routes
app.use("/api/v1/cart", cartRoutes);

app.use("/api/v1/order", orderRoutes);

app.use("/api/v1/payment", paymentRoutes);

app.use("/api/v1/support", supportRoutes);

app.use("/api/v1/inventory", inventoryRoutes)

app.use("/api/v1/admin", adminRoutes);

app.use("/api/v1/staff", staffRoutes);

app.use("/api/v1/upload", uploadRoutes);

app.use("/api/v1/banner", bannerRoutes);

app.use("/api/v1/refund", refundRoutes);

app.use("/api/v1/notification", notificationRoutes);

// Error handling middleware (must be last) 
app.use(errorHandler);

module.exports = app;
