const mongoose = require('mongoose');
const dns = require('dns');

// Windows sometimes fails MongoDB Atlas SRV DNS lookups even when the OS resolver works fine.
// Forcing Node to use Google's public DNS servers fixes this in most cases.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;