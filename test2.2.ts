import mongoose from 'mongoose';
import RawJob from './models/RawJob';
require('dotenv').config({ path: '.env.local' });
mongoose.connect(process.env.MONGODB_URI!).then(async () => {
  const total = await RawJob.countDocuments();
  const distinct = await RawJob.distinct('jobId');
  console.log('Total documents:', total);
  console.log('Distinct jobIds:', distinct.length);
  console.log('Duplicates:', total - distinct.length);
  mongoose.disconnect();
});
