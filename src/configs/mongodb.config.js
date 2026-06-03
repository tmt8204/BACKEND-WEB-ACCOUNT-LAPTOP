const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Retrying...');
    });

    mongoose.connection.on('error', (err) => {
            console.error('MongoDB error:', err.message);
    });
    
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
