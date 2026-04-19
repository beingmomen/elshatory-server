/* eslint-disable */
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

(async () => {
  await mongoose.connect(process.env.DATABASE_ATLAS);
  const idx = await mongoose.connection.db.collection('jobs').indexes();
  console.log(JSON.stringify(idx, null, 2));
  process.exit(0);
})();
