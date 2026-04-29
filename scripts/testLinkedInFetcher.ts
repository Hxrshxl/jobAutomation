import { loadProfiles } from '../lib/loadProfiles';
import { LinkedInFetcher } from '../services/fetcher/LinkedIn';
import dbConnect from '../lib/mongodb';

async function main() {
  await dbConnect();
  const profiles = loadProfiles();
  
  if (profiles.length === 0) {
    console.error('No profiles found.');
    process.exit(1);
  }

  const profile = profiles[0]; // test with first profile
  console.log(`Testing LinkedInFetcher with profile: ${profile.name}`);

  const fetcher = new LinkedInFetcher();
  const jobs = await fetcher.fetch(profile);

  console.log(`\nReturned ${jobs.length} job objects.`);
  
  if (jobs.length > 0) {
    console.log('\nSample job:');
    console.log(JSON.stringify(jobs[0], null, 2));
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});
