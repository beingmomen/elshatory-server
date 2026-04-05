const path = require('path');
const dotenv = require('dotenv');

let isLoaded = false;

module.exports = rootDir => {
  if (isLoaded) return;

  dotenv.config({ path: path.join(rootDir, '.env') });

  isLoaded = true;
};
