import { BaseFetcher, FetchOptions } from './BaseFetcher';
import { Profile } from '../../lib/loadProfiles';
import RawJob, { IRawJob } from '../../models/RawJob';
import { COMPANY_REGISTRY } from '../../config/targetCompanies';

export class CompanyBoardsFetcher extends BaseFetcher {
  async fetch(profile: Profile, options?: FetchOptions): Promise<Partial<IRawJob>[]> {
    const jobs: Partial<IRawJob>[] = [];
    const tiers = options?.tiers || ['all'];
    const freshness = options?.runType || 'full';
    
    const maxAgeMs = freshness === 'fresh' ? 2 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    
    if (tiers.includes('all')) {
      jobs.push(...await this.fetchForTier('tier1', profile, maxAgeMs));
      jobs.push(...await this.fetchForTier('tier2', profile, maxAgeMs));
      jobs.push(...await this.fetchForTier('tier3', profile, maxAgeMs));
    } else {
      for (const tier of tiers) {
        if (tier !== 'all') {
          jobs.push(...await this.fetchForTier(tier as any, profile, maxAgeMs));
        }
      }
    }

    return jobs;
  }

  async fetchForTier(tier: 'tier1' | 'tier2' | 'tier3', profile: Profile, maxAgeMs: number): Promise<Partial<IRawJob>[]> {
    const jobs: Partial<IRawJob>[] = [];
    const now = Date.now();

    console.log(`[CompanyBoards] Fetching ${tier}...`);

    const promises: Promise<Partial<IRawJob>[]>[] = [];

    for (const slug of COMPANY_REGISTRY.greenhouse[tier] || []) {
      promises.push(this.fetchGreenhouse(slug, profile, now, maxAgeMs).catch(e => {
        console.error(`[CompanyBoards] Error fetching Greenhouse for ${slug}:`, e);
        return [];
      }));
    }

    for (const slug of COMPANY_REGISTRY.lever[tier] || []) {
      promises.push(this.fetchLever(slug, profile, now, maxAgeMs).catch(e => {
        console.error(`[CompanyBoards] Error fetching Lever for ${slug}:`, e);
        return [];
      }));
    }

    for (const slug of COMPANY_REGISTRY.ashby[tier] || []) {
      promises.push(this.fetchAshby(slug, profile, now, maxAgeMs).catch(e => {
        console.error(`[CompanyBoards] Error fetching Ashby for ${slug}:`, e);
        return [];
      }));
    }

    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === 'fulfilled') {
        jobs.push(...result.value);
      }
    }

    return jobs;
  }

  private isJuniorRole(title: string): boolean {
    const lowerTitle = title.toLowerCase();
    const seniorKeywords = ['senior', 'sr', 'lead', 'manager', 'director', 'principal', 'head', 'vp', 'staff', 'architect', 'ii', 'iii', 'iv'];
    for (const kw of seniorKeywords) {
      if (lowerTitle.includes(kw)) {
        return false;
      }
    }
    return true; 
  }

  private async fetchGreenhouse(slug: string, profile: Profile, now: number, maxAgeMs: number): Promise<Partial<IRawJob>[]> {
    const jobs: Partial<IRawJob>[] = [];
    const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
    
    const res = await fetch(url);
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`Greenhouse API error: ${res.status}`);
    
    const data = await res.json();
    if (!data.jobs) return [];

    const name = slug.charAt(0).toUpperCase() + slug.slice(1);

    for (const job of data.jobs) {
      if (!this.isJuniorRole(job.title)) continue;

      const postedAt = job.updated_at ? new Date(job.updated_at) : new Date();
      if (now - postedAt.getTime() > maxAgeMs) continue;

      const cleanUrl = job.absolute_url.split('?')[0];
      const jobId = this._generateJobId(cleanUrl, postedAt.toISOString());

      const isSeen = await this._isAlreadySeen(jobId, profile.name, job.title, name);
      if (isSeen) continue;

      const newJob: Partial<IRawJob> = {
        jobId,
        title: job.title,
        company: name,
        location: job.location?.name || 'Remote/Unknown',
        source: 'greenhouse',
        url: cleanUrl,
        description: '',
        postedAt,
        easyApply: false,
        recruiter: '',
        fetchedAt: new Date(),
        seen: false,
      };

      await RawJob.findOneAndUpdate(
        { jobId: newJob.jobId },
        { $setOnInsert: newJob },
        { upsert: true, returnDocument: 'after' }
      );
      jobs.push(newJob);
    }
    return jobs;
  }

  private async fetchLever(slug: string, profile: Profile, now: number, maxAgeMs: number): Promise<Partial<IRawJob>[]> {
    const jobs: Partial<IRawJob>[] = [];
    const url = `https://api.lever.co/v0/postings/${slug}?mode=json`;
    
    const res = await fetch(url);
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`Lever API error: ${res.status}`);
    
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const name = slug.charAt(0).toUpperCase() + slug.slice(1);

    for (const job of data) {
      if (!this.isJuniorRole(job.text)) continue;

      const postedAt = job.createdAt ? new Date(job.createdAt) : new Date();
      if (now - postedAt.getTime() > maxAgeMs) continue;

      const cleanUrl = job.hostedUrl.split('?')[0];
      const jobId = this._generateJobId(cleanUrl, postedAt.toISOString());

      const isSeen = await this._isAlreadySeen(jobId, profile.name, job.text, name);
      if (isSeen) continue;

      const newJob: Partial<IRawJob> = {
        jobId,
        title: job.text,
        company: name,
        location: job.categories?.location || 'Remote/Unknown',
        source: 'lever',
        url: cleanUrl,
        description: job.descriptionPlain || '',
        postedAt,
        easyApply: false,
        recruiter: '',
        fetchedAt: new Date(),
        seen: false,
      };

      await RawJob.findOneAndUpdate(
        { jobId: newJob.jobId },
        { $setOnInsert: newJob },
        { upsert: true, returnDocument: 'after' }
      );
      jobs.push(newJob);
    }
    return jobs;
  }

  private async fetchAshby(slug: string, profile: Profile, now: number, maxAgeMs: number): Promise<Partial<IRawJob>[]> {
    const jobs: Partial<IRawJob>[] = [];
    const url = `https://jobs.ashbyhq.com/api/non-user-facing/posting-group/job-board?organizationHostedJobsPageName=${slug}`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`Ashby API error: ${res.status}`);
    
    const data = await res.json();
    if (!data?.data?.jobPostings) return [];

    const name = slug.charAt(0).toUpperCase() + slug.slice(1);

    for (const job of data.data.jobPostings) {
      if (!this.isJuniorRole(job.title)) continue;

      const postedAt = job.publishedAt ? new Date(job.publishedAt) : new Date();
      if (now - postedAt.getTime() > maxAgeMs) continue;

      const cleanUrl = job.jobPageUrl || '';
      if (!cleanUrl) continue;
      
      const jobId = this._generateJobId(cleanUrl, postedAt.toISOString());

      const isSeen = await this._isAlreadySeen(jobId, profile.name, job.title, name);
      if (isSeen) continue;

      const newJob: Partial<IRawJob> = {
        jobId,
        title: job.title,
        company: name,
        location: job.locationName || 'Remote/Unknown',
        source: 'ashby',
        url: cleanUrl,
        description: '', // Often not full desc in list
        postedAt,
        easyApply: false,
        recruiter: '',
        fetchedAt: new Date(),
        seen: false,
      };

      await RawJob.findOneAndUpdate(
        { jobId: newJob.jobId },
        { $setOnInsert: newJob },
        { upsert: true, returnDocument: 'after' }
      );
      jobs.push(newJob);
    }
    return jobs;
  }
}
