import * as dotenv from 'dotenv';
// Load .env.local before anything else
dotenv.config({ path: '.env.local' });

import { loadProfiles } from '../lib/loadProfiles';
import { fetchAll } from '../services/fetcher';
import dbConnect from '../lib/mongodb';

async function main() {
  console.log('--- Testing Fetcher Index (Aggregator) ---');
  
  if (process.env.USE_MOCK_DATA === 'true') {
    console.warn('⚠️ WARNING: USE_MOCK_DATA is currently set to true in .env.local!');
    console.warn('⚠️ The system will return fake jobs instantly and skip the real scrapers.');
    console.warn('⚠️ To test the real Playwright/RSS fetchers, set USE_MOCK_DATA=false.\n');
  }

  // Ensure DB connects (needed for deduplication)
  await dbConnect();
  
  const profiles = loadProfiles();
  if (profiles.length === 0) {
    console.error('No profiles found in config/profiles.');
    process.exit(1);
  }

  // We'll just use the first profile found for the test
  const profile = profiles[0];
  console.log(`Using profile: ${profile.name}`);
  console.log(`Keywords: ${profile.keywords.join(', ')}\n`);

  try {
    const start = Date.now();
    
    // Trigger the aggregator
    const jobs = await fetchAll(profile);
    
    const duration = Date.now() - start;

    console.log(`\n==========================================`);
    console.log(`✅ SUCCESS! Pipeline test completed.`);
    console.log(`Total deduplicated jobs returned: ${jobs.length}`);
    console.log(`Total execution time: ${(duration / 1000).toFixed(2)} seconds`);
    console.log(`==========================================\n`);
    
    // Print a few sample jobs to verify the data structure
    if (jobs.length > 0) {
      console.log('Sample Jobs:');
      jobs.slice(0, 3).forEach((job, i) => {
        console.log(`\n--- Job ${i + 1} ---`);
        console.log(`Title:    ${job.title}`);
        console.log(`Company:  ${job.company}`);
        console.log(`Source:   ${job.source}`);
        console.log(`Url:      ${job.url}`);
        console.log(`Posted:   ${job.postedAt}`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing fetchAll:', error);
  } finally {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Unhandled fatal error:', err);
  process.exit(1);
});
