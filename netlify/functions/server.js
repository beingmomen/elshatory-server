const serverless = require('serverless-http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const express = require('express'); // Add express import

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../config.env') });
const app = require('../../app');

// Serve static files from images directory
app.use('/images', express.static(path.join(__dirname, '../../images')));
let conn = null;

const connectDB = async () => {
  if (conn == null) {
    conn = await mongoose.connect(process.env.DATABASE_ATLAS, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    });
    return conn;
  }
  return conn;
};

// Handler for Netlify Functions
exports.handler = async (event, context) => {
  // Make context callbackWaitsForEmptyEventLoop = false to prevent timeout
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    // Connect to database
    await connectDB();

    // Run serverless app
    const handler = serverless(app);
    return await handler(event, context);
  } catch (error) {
    console.error('Server Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};

// For local development only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 1234;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`App running locally on http://localhost:${PORT}`);
    });
  });
}
