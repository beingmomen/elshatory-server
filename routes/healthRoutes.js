const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary.config');

const router = express.Router();

/**
 * Check database connection status
 * @returns {Object} Database status
 */
const checkDatabase = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      status: state === 1 ? 'healthy' : 'unhealthy',
      state: states[state]
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

/**
 * Check Cloudinary connection
 * @returns {Object} Cloudinary status
 */
const checkCloudinary = async () => {
  try {
    // Simple check to see if Cloudinary is configured
    if (
      cloudinary.config().cloud_name &&
      cloudinary.config().api_key &&
      cloudinary.config().api_secret
    ) {
      return {
        status: 'healthy',
        configured: true
      };
    }
    return {
      status: 'warning',
      configured: false,
      message: 'Cloudinary not fully configured'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

/**
 * Health check endpoint
 * GET /health
 */
router.get('/', async (req, res) => {
  try {
    const [database, cloudinaryStatus] = await Promise.all([
      checkDatabase(),
      checkCloudinary()
    ]);

    // Determine overall status
    const isHealthy =
      database.status === 'healthy' &&
      (cloudinaryStatus.status === 'healthy' ||
        cloudinaryStatus.status === 'warning');

    const statusCode = isHealthy ? 200 : 503;

    res.status(statusCode).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      checks: {
        database,
        cloudinary: cloudinaryStatus
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Readiness check endpoint
 * GET /health/ready
 * Used by orchestrators (Kubernetes, Docker Swarm) to check if app is ready
 */
router.get('/ready', async (req, res) => {
  try {
    const database = await checkDatabase();

    if (database.status === 'healthy') {
      res.status(200).json({
        status: 'ready',
        message: 'Application is ready to accept traffic'
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        message: 'Application is not ready to accept traffic',
        details: database
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});

/**
 * Liveness check endpoint
 * GET /health/live
 * Used by orchestrators to check if app is alive
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    message: 'Application is running'
  });
});

module.exports = router;
