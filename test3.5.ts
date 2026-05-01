import { parsePostedDate } from './lib/utils';
const testCases = [
  'just now',
  '2 hours ago',
  '2h',
  '2 Hours Ago',
  '2 Days Ago',
  '2d',
  'Posted 3 days ago',
  '1 week ago',
  '1w',
  '2025-05-01T10:30:00.000Z',
  'completely unrecognized format xyz',
];
const now = new Date();
console.log('Reference time:', now.toISOString());
for (const tc of testCases) {
  const result = parsePostedDate(tc);
  const diffHours = (now.getTime() - result.getTime()) / (1000 * 60 * 60);
  console.log(`Input: "${tc}" -> ${result.toISOString()} (~${diffHours.toFixed(1)}h ago)`);
}
