import { Browser, Page } from 'playwright';
import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { BaseFetcher, FetchOptions } from './BaseFetcher';
import { Profile } from '../../lib/loadProfiles';
import RawJob, { IRawJob } from '../../models/RawJob';
import { parsePostedDate } from '../../lib/utils';

chromium.use(stealthPlugin());

export class WellfoundFetcher extends BaseFetcher {
  async fetch(profile: Profile, options?: FetchOptions): Promise<Partial<IRawJob>[]> {
    const freshness = options?.runType || 'full';
    const jobs: Partial<IRawJob>[] = [];
    const userDataDir = './.browser_data/wellfound';
    const browserContext = await chromium.launchPersistentContext(userDataDir, { 
      headless: true, // Use true here for consistency with other fetchers, or keep false if user expects it
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage']
    });
    browserContext.setDefaultNavigationTimeout(12000);
    browserContext.setDefaultTimeout(8000);
    
    try {
      const page = browserContext.pages().length > 0 ? browserContext.pages()[0] : await browserContext.newPage();
      await this._setupPage(page);
      
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      });

      // To make it dynamic based on the profile, we can try to guess the role string.
      // Profile name is usually snake_case or similar, like "software_engineer"
      const roleStr = profile.name.replace(/_/g, '-');
      // For testing, fallback to the user specified URL format
      const searchUrl = `https://wellfound.com/jobs?role=${roleStr}&experience=0-1`;
      
      console.log(`[Wellfound] Navigating to ${searchUrl}`);
      await page.goto(searchUrl, { timeout: 12000, waitUntil: 'domcontentloaded' });
      await this.sleep(3000, 5000);

      // Give user time to solve CAPTCHA or login if needed
      try {
        console.log(`[Wellfound] Waiting for page to load (please solve CAPTCHA or login if prompted)...`);
        await page.waitForSelector('[class*="styles_component__"], [class*="styles_jobListing__"], [data-test="StartupResult"]', { timeout: 30000 });
      } catch (e) {
        console.log(`[Wellfound] Timeout waiting for job cards, might be blocked or require login.`);
      }

      // Scroll a bit
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await this.sleep(1000, 2000);
      }

      // Try a few possible selectors for job cards
      let jobCards = await page.$$('div.border-b.border-gray-400.py-3');
      if (jobCards.length === 0) {
        jobCards = await page.$$('[data-test="StartupResult"], [class*="styles_component__"], [class*="styles_jobListing__"], [class*="jobList_"] > div, [class*="component_"], [class*="styles_result__"]');
      }
      
      // wellfound typically groups jobs by company on the jobs page
      // let's grab any link that looks like a job posting
      const links = await page.$$eval('a', (els) => {
        return els.map(a => a.href).filter(href => href.includes('/jobs/') || href.includes('/company/'));
      });
      
      console.log(`[Wellfound] Found ${links.length} potential links`);

      // If we can't parse cards perfectly, let's at least grab basic info from what we can
      // Or we can just use the jobCards logic if it succeeds
      if (jobCards.length > 0) {
        console.log(`[Wellfound] Found ${jobCards.length} job cards`);
        for (const card of jobCards) {
          try {
            const titleLinkEl = await card.$('a[href*="/jobs/"]');
            let title = titleLinkEl ? (await titleLinkEl.innerText()).trim() : '';
            if (!title) {
               const titleElFallback = await card.$('h2, [class*="title"], .job-title');
               if (titleElFallback) title = (await titleElFallback.innerText()).trim();
            }

            const companyLinkEl = await card.$('a[href*="/company/"] img');
            let company = '';
            if (companyLinkEl) {
                const alt = await companyLinkEl.getAttribute('alt');
                if (alt) company = alt.replace(' company logo', '').trim();
            }
            if (!company) {
               const spanEl = await card.$('div.text-sm > span:first-child');
               if (spanEl) {
                  company = (await spanEl.innerText()).replace('•', '').trim();
               }
            }
            if (!company) {
               const companyElFallback = await card.$('h1, h2, h3, [class*="name"], .company-name');
               if (companyElFallback) company = (await companyElFallback.innerText()).trim();
            }

            const locationEl = await card.$('div.text-sm span.text-gray-700');
            let location = locationEl ? (await locationEl.innerText()).split('•')[0].trim() : '';
            if (!location) {
               const locationElFallback = await card.$('[class*="location"]');
               if (locationElFallback) location = (await locationElFallback.innerText()).trim();
            }

            const anchor = await card.$('a');
            const rawUrl = titleLinkEl ? await titleLinkEl.getAttribute('href') : (anchor ? await anchor.getAttribute('href') : '') || '';
            
            if (!rawUrl || !title || !company) {
               continue;
            }

            if (freshness === 'fresh') {
              const cardText = await card.innerText();
              const lowerCard = cardText.toLowerCase();
              const hasHours = lowerCard.includes('h') || lowerCard.includes('hour');
              const hasNow = lowerCard.includes('just now');
              const hasDaysOrWeeks = lowerCard.includes('day') || lowerCard.includes('week') || lowerCard.includes('d') || lowerCard.includes('w');
              
              if (hasDaysOrWeeks && !hasNow && !hasHours) {
                console.log(`[Wellfound] Skipping job due to freshness filter: ${title}`);
                continue;
              }
            }

            let url = rawUrl;
            if (url.startsWith('/')) {
              url = `https://wellfound.com${url}`;
            }

            const cleanUrl = url.split('?')[0];
            const postedAt = new Date();
            const jobId = this._generateJobId(cleanUrl, postedAt.toISOString());

            const isSeen = await this._isAlreadySeen(jobId, profile.name, title, company);
            if (isSeen) {
              console.log(`[Wellfound] Skipping already seen job: ${title}`);
              continue;
            }

            const newJob: Partial<IRawJob> = {
              jobId,
              title,
              company,
              location,
              source: 'wellfound',
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

          } catch (err) {
            console.error(`[Wellfound] Error processing a card: ${err}`);
          }
        }
      } else {
        console.log(`[Wellfound] No specific job cards found, might be blocked or require login.`);
      }

    } catch (err) {
      console.warn(`[Wellfound] Fetch error: ${err}`);
    } finally {
      await browserContext.close();
    }

    return jobs;
  }
}
