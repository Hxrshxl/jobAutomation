import { IRawJob } from '../../models/RawJob';
import { Profile } from '../../lib/loadProfiles';
import { mockJobs } from '../../data/mockJobs';
import { LinkedInFetcher } from './LinkedIn';
import { NaukriFetcher } from './Naukri';
import { IndeedFetcher } from './Indeed';
import { WellfoundFetcher } from './Wellfound';
import { CompanyBoardsFetcher } from './CompanyBoards';
import { FetchOptions } from './BaseFetcher';

export async function fetchAll(profile: Profile, options: FetchOptions = { runType: 'full', tiers: ['all'] }): Promise<Partial<IRawJob>[]> {
  const useMockData = process.env.USE_MOCK_DATA === 'true';
  
  if (useMockData) {
    console.log(`[Fetcher] Using mock data for profile: ${profile.name}`);
    return mockJobs as Partial<IRawJob>[];
  }
  
  const fetchers = [
    { name: 'LinkedIn', instance: new LinkedInFetcher() },
    { name: 'Naukri', instance: new NaukriFetcher() },
    { name: 'Indeed', instance: new IndeedFetcher() },
    { name: 'Wellfound', instance: new WellfoundFetcher() },
    { name: 'CompanyBoards', instance: new CompanyBoardsFetcher() },
  ];

  console.log(`[Fetcher] Starting parallel fetch from ${fetchers.length} sources...`);

  // Call all fetchers in parallel with Promise.allSettled()
  const results = await Promise.allSettled(
    fetchers.map(f => f.instance.fetch(profile, options).then((jobs: Partial<IRawJob>[]) => ({ name: f.name, jobs })))
  );

  const allJobs: Partial<IRawJob>[] = [];
  const summary: Record<string, number> = {};

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { name, jobs } = result.value;
      summary[name] = jobs.length;
      allJobs.push(...jobs);
    } else {
      console.error(`[Fetcher] Fetcher failed:`, result.reason);
    }
  }

  // Deduplicate across sources by jobId before returning
  const uniqueJobsMap = new Map<string, Partial<IRawJob>>();
  for (const job of allJobs) {
    if (job.jobId && !uniqueJobsMap.has(job.jobId)) {
      uniqueJobsMap.set(job.jobId, job);
    }
  }

  const uniqueJobs = Array.from(uniqueJobsMap.values());

  // Log per-source job counts summary
  console.log(`[Fetcher] Fetch complete. Summary:`);
  Object.entries(summary).forEach(([source, count]) => {
    console.log(`  - ${source}: ${count} jobs`);
  });
  console.log(`[Fetcher] Total unique jobs fetched: ${uniqueJobs.length}`);

  return uniqueJobs;
}

// Keep the old fetchJobs function to not break existing tests/imports,
// but delegate it to fetchAll
export async function fetchJobs(profile: Profile, options: FetchOptions = { runType: 'full', tiers: ['all'] }): Promise<IRawJob[]> {
  const results = await fetchAll(profile, options);
  return results as IRawJob[];
}
