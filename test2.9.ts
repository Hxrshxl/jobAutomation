import { fetchAll } from './services/fetcher/index';
import { loadProfiles } from './lib/loadProfiles';
require('dotenv').config({ path: '.env.local' });
process.env.USE_MOCK_DATA = 'true';

const profiles = loadProfiles();
const profile = profiles[0];
console.time('fetchAll');
fetchAll(profile).then(jobs => {
  console.timeEnd('fetchAll');
  console.log('=== FETCH SUMMARY ===');
  console.log('Total unique jobs:', jobs.length);
  
  const bySource = jobs.reduce((acc: Record<string, number>, j) => {
    const src = j.source || 'unknown';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});
  console.log('By source:', JSON.stringify(bySource, null, 2));
  
  const duplicateCheck = new Set(jobs.map(j => j.jobId));
  console.log('Unique jobIds:', duplicateCheck.size);
  console.log('Cross-source duplicates removed:', jobs.length - duplicateCheck.size);
  process.exit(0);
});
