import mongoose from 'mongoose';
import ScoredJob from './models/ScoredJob';
require('dotenv').config({ path: '.env.local' });
mongoose.connect(process.env.MONGODB_URI!).then(async () => {
  const count = await ScoredJob.countDocuments();
  const sample = await ScoredJob.findOne().sort({ scoredAt: -1 });
  
  console.log('Total ScoredJob documents:', count);
  console.log('Most recent scored job:');
  console.log(JSON.stringify({
    jobId: sample?.jobId,
    title: sample?.title,
    company: sample?.company,
    score: sample?.score,
    scoreBreakdown: sample?.scoreBreakdown,
    profile: sample?.profile,
    scoredAt: sample?.scoredAt
  }, null, 2));
  
  // Test compound unique index
  if (sample) {
    try {
      await ScoredJob.create({ ...sample.toObject(), _id: new mongoose.Types.ObjectId() });
      console.log('FAIL: Duplicate insert should have thrown');
    } catch (e: any) {
      console.log('PASS: Compound unique index correctly rejected duplicate:', e.code === 11000 ? 'E11000 duplicate key' : e.message);
    }
  }
  
  mongoose.disconnect();
});
