import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import RawJob from '../models/RawJob';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const count = await RawJob.countDocuments();
  console.log(`\n✅ RawJob documents count: ${count}`);

  const duplicates = await RawJob.aggregate([
    { $group: { _id: "$jobId", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  
  if (duplicates.length === 0) {
    console.log('✅ ZERO duplicate jobIds found.');
  } else {
    console.log(`❌ Found ${duplicates.length} duplicate jobIds!`);
  }

  process.exit(0);
}

main();
