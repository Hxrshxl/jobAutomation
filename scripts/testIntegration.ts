import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { loadProfiles } from '../lib/loadProfiles';
import { runPipeline } from '../services/orchestrator';
import dbConnect from '../lib/mongodb';
import RawJob from '../models/RawJob';

async function main() {
  await dbConnect();
  
  // Clear the collection to test freshly
  await RawJob.deleteMany({});
  console.log('Cleared RawJob collection for fresh test.');

  const profiles = loadProfiles();
  const seProfile = profiles.find(p => p.name === 'software_engineer');
  if (!seProfile) {
    throw new Error('software_engineer profile not found!');
  }

  console.log('\n--- RUN 1 ---');
  const summary1 = await runPipeline(seProfile);
  console.log(summary1);

  const count1 = await RawJob.countDocuments();
  console.log(`\nRawJob documents after run 1: ${count1}`);

  // Check for duplicate jobIds
  const duplicates = await RawJob.aggregate([
    { $group: { _id: "$jobId", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  console.log(`Duplicate jobIds found: ${duplicates.length}`);
  
  console.log('\n--- RUN 2 ---');
  const summary2 = await runPipeline(seProfile);
  console.log(summary2);
  
  const count2 = await RawJob.countDocuments();
  console.log(`\nRawJob documents after run 2: ${count2}`);

  if (count1 === count2) {
    console.log('✅ Deduplication works! No new documents created on run 2.');
  } else {
    console.log('❌ Deduplication failed! New documents were created.');
  }

  process.exit(0);
}

main().catch(console.error);
