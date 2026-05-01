import { XMLParser } from 'fast-xml-parser';
import { BaseFetcher, FetchOptions } from './BaseFetcher';
import { Profile } from '../../lib/loadProfiles';
import RawJob, { IRawJob } from '../../models/RawJob';
import { parsePostedDate } from '../../lib/utils';

export class IndeedFetcher extends BaseFetcher {
  async fetch(profile: Profile, options?: FetchOptions): Promise<Partial<IRawJob>[]> {
    const freshness = options?.runType || 'full';
    const jobs: Partial<IRawJob>[] = [];
    
    try {
      const rssUrl = new URL('https://in.indeed.com/rss');
      // Use a shorter query to prevent 404 from Indeed
      const query = profile.keywords.slice(0, 2).join(' ') || profile.name.replace(/_/g, ' ');
      rssUrl.searchParams.set('q', query);
      rssUrl.searchParams.set('l', 'India');
      rssUrl.searchParams.set('explvl', 'entry_level');
      rssUrl.searchParams.set('sort', 'date');

      console.log(`[Indeed] Fetching RSS feed from ${rssUrl.toString()}`);

      const response = await fetch(rssUrl.toString());
      if (!response.ok) {
        throw new Error(`Indeed RSS HTTP error: ${response.status}`);
      }

      const xml = await response.text();
      const parser = new XMLParser();
      const parsed = parser.parse(xml);
      
      let items = parsed?.rss?.channel?.item;
      if (!items) {
        console.log(`[Indeed] No job items found in RSS feed.`);
        return [];
      }
      
      if (!Array.isArray(items)) {
        items = [items];
      }

      console.log(`[Indeed] Found ${items.length} job items in RSS feed`);

      const now = Date.now();
      const maxAgeMs = 48 * 60 * 60 * 1000; // 48 hours

      for (const item of items) {
        try {
          const titleRaw = item.title || '';
          const url = item.link || '';
          // Indeed RSS often puts the company in the 'source' tag, or as part of the title
          let company = item.source || '';
          
          let title = titleRaw;
          if (!company && titleRaw.includes('-')) {
            // Attempt to parse "Title - Company - Location"
            const parts = titleRaw.split('-');
            title = parts[0].trim();
            if (parts.length > 1) {
              company = parts[1].trim();
            }
          }

          const description = item.description || '';
          const pubDateStr = item.pubDate || '';
          
          if (!title || !url) continue;

          const postedAt = parsePostedDate(pubDateStr);

          // Filter out items older than maxAge
          const maxAgeMs = freshness === 'fresh' ? 2 * 60 * 60 * 1000 : 48 * 60 * 60 * 1000; // 2 hours or 48 hours
          if (now - postedAt.getTime() > maxAgeMs) {
            continue;
          }

          // Clean URL 
          let cleanUrl = url.split('?')[0];
          const vjkMatch = url.match(/vjk=([^&]+)/) || url.match(/jk=([^&]+)/);
          if (vjkMatch) {
            cleanUrl = `https://in.indeed.com/viewjob?jk=${vjkMatch[1]}`;
          }

          const jobId = this._generateJobId(cleanUrl, postedAt.toISOString());

          const isSeen = await this._isAlreadySeen(jobId, profile.name, title, company);
          if (isSeen) {
            console.log(`[Indeed] Skipping already seen job: ${title}`);
            continue;
          }

          const newJob: Partial<IRawJob> = {
            jobId,
            title,
            company: company || 'Unknown Company',
            location: 'India',
            source: 'indeed',
            url: cleanUrl,
            description,
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

        } catch (err) {
          console.error(`[Indeed] Error processing an RSS item: ${err}`);
        }
      }

    } catch (err) {
      console.warn(`[Indeed] Fetch error: ${err}`);
    }

    return jobs;
  }
}
