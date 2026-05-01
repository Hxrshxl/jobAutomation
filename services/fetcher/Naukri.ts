import fs from 'fs';
import path from 'path';
import { createStealthBrowser } from '../../lib/browserFactory';
import { BaseFetcher, FetchOptions } from './BaseFetcher';
import { Profile } from '../../lib/loadProfiles';
import RawJob, { IRawJob } from '../../models/RawJob';
import { parsePostedDate } from '../../lib/utils';
export class NaukriFetcher extends BaseFetcher {
  async fetch(profile: Profile, options?: FetchOptions): Promise<Partial<IRawJob>[]> {
    const freshness = options?.runType || 'full';
    const jobs: Partial<IRawJob>[] = [];
    const sessionPath = path.join(process.cwd(), 'data', 'sessions', 'naukri-session.json');
    const hasSession = fs.existsSync(sessionPath);
    const { browser, context } = await createStealthBrowser(hasSession ? sessionPath : undefined);
    
    if (hasSession) {
      const testPage = await context.newPage();
      try {
        await testPage.goto('https://www.naukri.com/', { timeout: 15000, waitUntil: 'domcontentloaded' });
        const isLoggedIn = await testPage.evaluate(() => {
          return !document.querySelector('#login_Layer');
        });
        if (!isLoggedIn) {
          console.warn(`[Naukri] Session expired or invalid. Falling back to title-only extraction.`);
        } else {
          console.log(`[Naukri] Session loaded and validated successfully.`);
        }
      } catch (err) {
        console.warn(`[Naukri] Failed to validate session: ${err}`);
      } finally {
        await testPage.close();
      }
    } else {
      console.log(`[Naukri] No session found. Falling back to title-only extraction.`);
    }
    
    try {
      const page = await context.newPage();
      await this._setupPage(page);
      
      // Naukri uses dashes for spaces in URLs
      const keyword = profile.keywords[0] || profile.name.replace(/_/g, ' ');
      const keywords = encodeURIComponent(keyword.replace(/\s+/g, '-'));
      
      // Navigate to naukri.com search with experience=0&experience=2 filter
      let searchUrl = `https://www.naukri.com/${keywords}-jobs?experience=0&experience=2`;
      if (freshness === 'fresh') {
        searchUrl += '&freshness=1';
      }
      
      console.log(`[Naukri] Navigating to ${searchUrl}`);
      
      // Go to search page
      await page.goto(searchUrl, { timeout: 12000, waitUntil: 'domcontentloaded' });
      
      // Wait specifically for job cards to appear
      await page.waitForSelector('.srp-jobtuple-wrapper', { timeout: 15000 }).catch(() => console.log('Timeout waiting for job cards'));
      await this.sleep(3000, 8000); // Randomized delay
      
      // Scroll to load job cards
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await this.sleep(1000, 2000);
      }

      // Extract job cards using standard Naukri selectors
      const jobCards = await page.$$('.srp-jobtuple-wrapper');
      console.log(`[Naukri] Found ${jobCards.length} job cards`);

      for (const card of jobCards) {
        try {
          const titleEl = await card.$('a.title');
          const title = titleEl ? (await titleEl.innerText()).trim() : '';

          const companyEl = await card.$('a.comp-name');
          const company = companyEl ? (await companyEl.innerText()).trim() : '';

          const locationEl = await card.$('span.locWdth');
          const location = locationEl ? (await locationEl.innerText()).trim() : '';

          const urlEl = await card.$('a.title');
          const url = urlEl ? await urlEl.getAttribute('href') : '';
          
          if (!url || !title || !company) continue;

          // Strip query params from url for cleaner ID
          const cleanUrl = url.split('?')[0];

          // Extract postedAt to use in ID generation
          const postedAtEl = await card.$('span.job-post-day');
          const postedText = postedAtEl ? (await postedAtEl.innerText()).trim() : '';
          const postedAt = parsePostedDate(postedText);

          if (freshness === 'fresh') {
            const maxAgeMs = 2 * 60 * 60 * 1000;
            if (Date.now() - postedAt.getTime() > maxAgeMs) {
              console.log(`[Naukri] Skipping job due to freshness filter: ${title}`);
              continue;
            }
          }

          const jobId = this._generateJobId(cleanUrl, postedAt.toISOString());

          // Filter out already-seen job IDs and check cross-platform duplicates (LinkedIn)
          const isSeen = await this._isAlreadySeen(jobId, profile.name, title, company);
          if (isSeen) {
            console.log(`[Naukri] Skipping already seen or duplicate job: ${title} at ${company}`);
            continue;
          }

          // Open job detail page for description
          const detailPage = await context.newPage();
          try {
            await this._setupPage(detailPage);
            await detailPage.goto(cleanUrl, { timeout: 12000, waitUntil: 'domcontentloaded' });
            await this.sleep(3000, 8000); // Randomized delay

            let description = '';
            // Handle Naukri login wall: skip jobs that require login to view description
            if (detailPage.url().toLowerCase().includes('login')) {
              console.log(`[Naukri] Hit login wall for ${cleanUrl}. Leaving description empty for title-only scoring.`);
            } else {
              // Extract description
              const descEl = await detailPage.$('.job-desc, .dang-inner-html');
              description = descEl ? (await descEl.innerHTML()).trim() : '';
            }

            // Check for Easy Apply / Quick Apply / Direct Apply
            // Naukri doesn't exactly have "Easy Apply" in the same way, but it has "Apply" vs company site redirect
            const easyApply = !cleanUrl.includes('company');

            const newJob: Partial<IRawJob> = {
              jobId,
              title,
              company,
              location,
              source: 'naukri',
              url: cleanUrl,
              description,
              postedAt,
              easyApply,
              recruiter: '',
              fetchedAt: new Date(),
              seen: false,
            };
            // Save results to MongoDB RawJob collection idempotently
            await RawJob.findOneAndUpdate(
              { jobId: newJob.jobId },
              { $setOnInsert: newJob },
              { upsert: true, returnDocument: 'after' }
            );
            jobs.push(newJob);

          } finally {
            await detailPage.close();
          }

        } catch (err) {
          console.error(`[Naukri] Error processing a card: ${err}`);
        }
      }

    } catch (err) {
      console.warn(`[Naukri] Fetch error: ${err}`);
      return []; // Return empty array on error
    } finally {
      await browser.close();
    }

    return jobs;
  }
}
