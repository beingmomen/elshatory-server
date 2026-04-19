/* eslint-disable */
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const Job = require('../models/jobModel');

(async () => {
  await mongoose.connect(process.env.DATABASE_ATLAS);
  const coll = mongoose.connection.db.collection('jobs');

  const before = await coll.indexes();
  console.log('--- BEFORE ---');
  console.log(before.map(i => i.name).join('\n'));

  const stale = [
    'source_1_sourceJobId_1',
    'source_1_jobUrl_1',
    'job_text_index'
  ];

  for (const name of stale) {
    try {
      await coll.dropIndex(name);
      console.log('dropped:', name);
    } catch (err) {
      console.log('skip:', name, err.codeName || err.message);
    }
  }

  await Job.syncIndexes();
  const after = await coll.indexes();
  console.log('--- AFTER ---');
  console.log(after.map(i => `${i.name} unique=${!!i.unique} keys=${JSON.stringify(i.key)}`).join('\n'));

  process.exit(0);
})();
