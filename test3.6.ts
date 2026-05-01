import { escapeLaTeX } from './lib/utils';
const testCases = [
  'AT&T',
  'C++ Corp',
  'R&D Solutions',
  'Procter & Gamble',
  '100% Remote',
  'salary: $80,000',
  'role_type: full_time',
  'tech^stack',
  'org {name}',
  'Normal Company Name',
];
for (const tc of testCases) {
  console.log(`Input:  "${tc}"`);
  console.log(`Output: "${escapeLaTeX(tc)}"`);
  console.log('');
}
