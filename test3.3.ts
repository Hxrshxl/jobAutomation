import { scoreJob } from './services/scorer';
import { filterJobs } from './services/filter';
import { loadProfiles } from './lib/loadProfiles';
require('dotenv').config({ path: '.env.local' });
const profiles = loadProfiles();
const profile = profiles[0];

const jobs = Array.from({ length: 25 }, (_, i) => ({
  jobId: `synthetic-${i}`,
  title: i % 5 === 0 ? 'Senior Engineer' : 'Software Engineer',
  description: i < 10 
    ? 'Excellent position for software engineer with React Node.js TypeScript 0-2 years experience. Requirements include REST API development and MongoDB.' 
    : 'Some developer job with minimal description.',
  company: `Company${i}`, location: 'Pune', source: 'test',
  url: `https://test.com/${i}`,
  postedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000),
  fetchedAt: new Date(), seen: false
}));

const filtered = filterJobs(jobs as any, profile);
const scored = filtered.map(j => scoreJob(j as any, profile));
const passed = scored.filter(j => (j.score || 0) >= Number(process.env.SCORE_THRESHOLD ?? 75));
const top20 = passed.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, Number(process.env.MAX_JOBS_PER_PROFILE ?? 20));

console.log('Input jobs:', jobs.length);
console.log('After filter:', filtered.length);
console.log('After scoring:', scored.length);
console.log('Passed threshold (>=75):', passed.length);
console.log('After top-N cap (max 20):', top20.length);
console.log('Score distribution:', scored.map(j => j.score).sort((a,b) => b-a));
