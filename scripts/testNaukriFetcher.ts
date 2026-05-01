import { loadProfiles } from '../lib/loadProfiles';
import { NaukriFetcher } from '../services/fetcher/Naukri';
import dbConnect from '../lib/mongodb';

async function main() {
  await dbConnect();
  const profiles = loadProfiles();
  
  const profile = profiles.find(p => p.name === 'software_engineer');
  if (!profile) {
    console.error('software_engineer profile not found.');
    process.exit(1);
  }

  console.log(`Testing NaukriFetcher with profile: ${profile.name}`);

  const fetcher = new NaukriFetcher();
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
