const mongoose = require('mongoose');

// Cached so serverless invocations (Vercel) reuse one connection instead of reconnecting per request.
let connection = null;

const connectDB = () => {
  if (!connection) {
    // MONGODB_URI is the name injected by Vercel's MongoDB Atlas integration
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
      const err = new Error('Database is not configured yet. Please try again later.');
      if (!process.env.VERCEL) {
        console.error('MONGO_URI is missing in server/.env');
        process.exit(1);
      }
      return Promise.reject(err);
    }
    connection = mongoose
      .connect(uri)
      .then(() => console.log('MongoDB connected'))
      .catch((err) => {
        console.error('MongoDB connection failed:', err.message);
        connection = null;
        if (!process.env.VERCEL) process.exit(1);
        throw err;
      });
  }
  return connection;
};

module.exports = connectDB;
