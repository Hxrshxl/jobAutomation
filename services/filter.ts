import { IRawJob } from '../models/RawJob';
import { Profile } from '../lib/loadProfiles';

export function filterJobs(jobs: Partial<IRawJob>[], profile: Profile): Partial<IRawJob>[] {
  const stats = {
    totalInput: jobs.length,
    rejectedByLength: 0,
    rejectedByExperience: 0,
    rejectedByTitle: 0,
    rejectedByDomain: 0,
    passed: 0
  };

  const expRegex = /\b([3-9]|[1-9]\d+)\+?\s*years?\s*(of\s*)?experience/i;

  const passedJobs = jobs.filter(job => {
    // Rule 4: Minimum description length (200 chars)
    const desc = job.description || '';
    if (desc.length < 200) {
      stats.rejectedByLength++;
      return false;
    }

    // Rule 1: Experience gate (reject >= 3 years)
    if (expRegex.test(desc)) {
      stats.rejectedByExperience++;
      return false;
    }

    // Rule 2: Title reject
    const title = (job.title || '').toLowerCase();
    const rejectWords = profile.rejectKeywords || [
      'senior', 'lead', 'manager', 'director', 'vp', 'head', 'architect', 'principal', 'staff'
    ];
    const isTitleRejected = rejectWords.some(keyword => title.includes(keyword.toLowerCase()));
    if (isTitleRejected) {
      stats.rejectedByTitle++;
      return false;
    }

    // Rule 3: Domain match (at least 2 keywords)
    const textToMatch = `${title} ${desc}`.toLowerCase();
    let matchCount = 0;
    const keywords = profile.keywords || [];
    
    // We check how many distinct keywords appear in the text
    for (const keyword of keywords) {
      if (textToMatch.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    if (matchCount < 2) {
      stats.rejectedByDomain++;
      return false;
    }

    return true;
  });

  stats.passed = passedJobs.length;

  console.log('[Filter] Job Filtering Summary:');
  console.log(`  - Total Input:          ${stats.totalInput}`);
  console.log(`  - Rejected (Length <200): ${stats.rejectedByLength}`);
  console.log(`  - Rejected (Exp >= 3yr):  ${stats.rejectedByExperience}`);
  console.log(`  - Rejected (Title):       ${stats.rejectedByTitle}`);
  console.log(`  - Rejected (Domain <2):   ${stats.rejectedByDomain}`);
  console.log(`  - Passed:                 ${stats.passed}`);

  return passedJobs;
}
