const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  mongoose.set('strictQuery', true);

  // Connection event listeners
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
    console.log(`${signal} received. Closing MongoDB connection...`);
    await mongoose.connection.close();
    process.exit(0);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

module.exports = connectDB;
