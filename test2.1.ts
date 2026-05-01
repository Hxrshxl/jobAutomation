import mongoose from 'mongoose';
import RawJob from './models/RawJob';
require('dotenv').config({ path: '.env.local' });
mongoose.connect(process.env.MONGODB_URI!).then(async () => {
  const count = await RawJob.countDocuments();
  const sample = await RawJob.findOne();
  console.log('RawJob count:', count);
  console.log('Sample doc:', JSON.stringify(sample, null, 2));
  mongoose.disconnect();
});
