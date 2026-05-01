import { scoreJob } from './services/scorer';
import { loadProfiles } from './lib/loadProfiles';

const profiles = loadProfiles();
const profile = profiles.find(p => p.name === 'software_engineer')!;

const testCases = [
  {
    label: 'PERFECT MATCH — should score ~90+',
    job: {
      jobId: 'test-1',
      title: 'Software Engineer',
      description: 'We are looking for a software engineer with 0-1 years experience. Must know React, Node.js, TypeScript, REST APIs, MongoDB. Responsibilities include building features, writing tests, and reviewing code. Requirements: Bachelor degree in CS.',
      company: 'Razorpay', location: 'Pune', source: 'test',
      url: 'https://test.com', postedAt: new Date(), fetchedAt: new Date(), seen: false
    }
  },
  {
    label: 'BORDERLINE — should score 60-75',
    job: {
      jobId: 'test-2',
      title: 'Developer',
      description: 'We need a developer for our team. Some coding experience required. Work on various projects.',
      company: 'SmallCo', location: 'Mumbai', source: 'test',
      url: 'https://test.com/2',
      postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      fetchedAt: new Date(), seen: false
    }
  },
  {
    label: 'WEAK MATCH — should score <60',
    job: {
      jobId: 'test-3',
      title: 'Full Stack Developer',
      description: 'Experienced developer needed for enterprise projects. 2 years minimum.',
      company: 'OldCo', location: 'Delhi', source: 'test',
      url: 'https://test.com/3',
      postedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days old
      fetchedAt: new Date(), seen: false
    }
  }
];

for (const tc of testCases) {
  const scored = scoreJob(tc.job as any, profile);
  console.log('');
  console.log('=== ' + tc.label + ' ===');
  console.log('Total Score:', scored.score, '/ 100');
  console.log('Breakdown:', JSON.stringify(scored.scoreBreakdown, null, 2));
}
