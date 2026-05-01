const required = [
  'MONGODB_URI',
  'OPENAI_API_KEY',
  'GOOGLE_DRIVE_CLIENT_ID',
  'GOOGLE_DRIVE_CLIENT_SECRET', 
  'GOOGLE_DRIVE_REFRESH_TOKEN',
  'GOOGLE_SHEETS_ID',
  'GOOGLE_SHEETS_TAB_NAME',
  'SCORE_THRESHOLD',
  'MAX_JOBS_PER_PROFILE',
  'PIPELINE_SECRET'
];
require('dotenv').config({ path: '.env.local' });
const missing = required.filter(k => !process.env[k]);
const present = required.filter(k => !!process.env[k]);
console.log('PRESENT:', present.join(', '));
console.log('MISSING:', missing.length ? missing.join(', ') : 'None');
