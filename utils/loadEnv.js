const path = require('path');
const dotenv = require('dotenv');

let isLoaded = false;

module.exports = rootDir => {
  if (isLoaded) return;

  // In production, rely on platform-provided environment variables only.
  if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.join(rootDir, '.env') });
  }

  isLoaded = true;
};
