import mongoose from 'mongoose';
import RawJob from './models/RawJob';
import ScoredJob from './models/ScoredJob';
import JobResult from './models/JobResult';
require('dotenv').config({ path: '.env.local' });
mongoose.connect(process.env.MONGODB_URI!).then(async () => {
  const raw = await RawJob.countDocuments();
  const scored = await ScoredJob.countDocuments();
  const results = await JobResult.countDocuments();
  console.log('=== COLLECTION COUNTS ===');
  console.log('RawJob:', raw);
  console.log('ScoredJob:', scored);
  console.log('JobResult:', results);
  const passedThreshold = await ScoredJob.countDocuments({ score: { $gte: 75 } });
  console.log('Jobs scored >= 75:', passedThreshold);
  console.log('Funnel: ' + raw + ' fetched -> ' + scored + ' scored -> ' + passedThreshold + ' qualified -> ' + results + ' in results');
  mongoose.disconnect();
});
