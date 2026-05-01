import { loadProfiles } from './lib/loadProfiles';
const profiles = loadProfiles();
console.log('Profiles loaded:', profiles.length);
profiles.forEach(p => console.log(' -', p.name, '| keywords:', p.keywords.length, '| rejectKeywords:', p.rejectKeywords.length));
