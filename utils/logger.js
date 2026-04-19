/**
 * Logger utility for consistent logging across the application
 * Respects NODE_ENV and provides structured logging
 */
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  info(message, data = {}) {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.log(`[INFO] ${message}`, data);
    }
  }

  warn(message, data = {}) {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${message}`, data);
  }

  error(message, error = {}) {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`, error);
  }
}

module.exports = new Logger();
