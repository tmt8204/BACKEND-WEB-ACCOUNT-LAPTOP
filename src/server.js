require("dotenv").config();

const app = require("./app");
const seedService = require("./services/seed.service");

const PORT = process.env.PORT;

// Start server and seed database
const startServer = async () => {
  try {
    // Wait a moment for MongoDB connection to be established
    setTimeout(async () => {
      await seedService.seed();
      
      app.listen(PORT, () => {
        console.log(`Server running at port: ${PORT}`);
      });
    }, 1000);
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
