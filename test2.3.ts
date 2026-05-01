import { BaseFetcher, FetchOptions } from './services/fetcher/BaseFetcher';
import { Profile } from './lib/loadProfiles';
import { IRawJob } from './models/RawJob';

const f = new (class extends BaseFetcher { 
  fetch(profile: Profile, options?: FetchOptions): Promise<Partial<IRawJob>[]> { 
    return Promise.resolve([]); 
  } 
})();

const id1 = f['_generateJobId']('https://jobs.example.com/123', '2025-05-01');
const id2 = f['_generateJobId']('https://jobs.example.com/123', '2025-05-01');
const id3 = f['_generateJobId']('https://jobs.example.com/123', '2025-05-02'); // different date

console.log('id1 (run 1):', id1);
console.log('id2 (run 2):', id2);
console.log('id3 (diff date):', id3);
console.log('id1 === id2 (should be TRUE):', id1 === id2);
console.log('id1 === id3 (should be FALSE):', id1 === id3);
