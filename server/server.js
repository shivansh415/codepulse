require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const startCacheWarmingJob = require('./src/jobs/refreshCache');

const PORT = process.env.PORT || 5000;

if (process.env.VERCEL) {
  // Vercel runs the exported app as a function; DB connects lazily per request (see app.js)
  module.exports = app;
} else {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startCacheWarmingJob();
    });
  });
}
