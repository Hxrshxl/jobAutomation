import crypto from 'crypto';
import { Page } from 'playwright';
import dbConnect from '../../lib/mongodb';
import RawJob, { IRawJob } from '../../models/RawJob';
import ScoredJob from '../../models/ScoredJob';
import { Profile } from '../../lib/loadProfiles';

export interface FetchOptions {
  runType?: 'fresh' | 'full';
  tiers?: ('tier1' | 'tier2' | 'tier3' | 'all')[];
}

export abstract class BaseFetcher {
  /**
   * Main fetch method to be implemented by specific job board fetchers.
   * We return Partial<IRawJob> because Mongoose Document properties like _id 
   * might not be present until it is saved to the database.
   */
  abstract fetch(profile: Profile, options?: FetchOptions): Promise<Partial<IRawJob>[]>;

  /**
   * Generates a deterministic SHA-256 hash for a given URL and postedAt to use as a unique jobId.
   */
  protected _generateJobId(url: string, postedAt: string): string {
    return crypto.createHash('sha256').update(url + postedAt).digest('hex').slice(0, 16);
  }

  /**
   * Random sleep between min and max milliseconds.
   */
  protected sleep(min: number, max: number): Promise<void> {
    return new Promise(r => setTimeout(r, Math.random() * (max - min) + min));
  }

  /**
   * Blocks media, fonts, and analytics trackers to speed up page load and reduce bot detection.
   */
  protected async _setupPage(page: Page): Promise<void> {
    await page.route(
      '**/*.{png,jpg,jpeg,gif,webp,svg,ico,woff,woff2,ttf,eot,mp4,mp3}',
      route => route.abort()
    );

    await page.route('**/(google-analytics|googletagmanager|hotjar|mixpanel|segment).**', 
      route => route.abort()
    );
  }

  /**
   * Checks if a job has already been seen in the system by looking up the 
   * jobId in both the RawJob and ScoredJob collections.
   */
  protected async _isAlreadySeen(jobId: string, profileName: string, title?: string, company?: string): Promise<boolean> {
    await dbConnect();

    // 1. Check if the job was already fetched and stored globally by jobId
    const rawExists = await RawJob.exists({ jobId });
    if (rawExists) return true;

    // 2. Check if the job was already scored specifically for this profile combo
    const scoredExists = await ScoredJob.exists({ jobId, profile: profileName });
    if (scoredExists) return true;

    // 3. Cross-platform deduplication: check if same title and company exists
    if (title && company) {
      const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const crossPlatformExists = await RawJob.exists({ 
        title: { $regex: new RegExp(`^${escapeRegex(title)}$`, 'i') },
        company: { $regex: new RegExp(`^${escapeRegex(company)}$`, 'i') } 
      });
      if (crossPlatformExists) return true;
    }

    return false;
  }
}
