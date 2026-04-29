import { chromium } from 'playwright';
import { BaseFetcher } from './BaseFetcher';
import { Profile } from '../../lib/loadProfiles';
import RawJob, { IRawJob } from '../../models/RawJob';

export class LinkedInFetcher extends BaseFetcher {
  async fetch(profile: Profile): Promise<Partial<IRawJob>[]> {
    const jobs: Partial<IRawJob>[] = [];
    const browser = await chromium.launch({ headless: true });
    
    try {
      const page = await browser.newPage();
      
      const keywords = encodeURIComponent(profile.keywords.join(' '));
      const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${keywords}&f_E=1`;
      
      console.log(`[LinkedIn] Navigating to ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000); // 2-second delay to avoid rate limiting

      // Scroll a bit to load job cards (LinkedIn lazy loads)
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(1000);
      }

      // Extract job cards
      const jobCards = await page.$$('ul.jobs-search__results-list > li');
      console.log(`[LinkedIn] Found ${jobCards.length} job cards`);

      for (const card of jobCards) {
        try {
          const titleEl = await card.$('.base-search-card__title');
          const title = titleEl ? (await titleEl.innerText()).trim() : '';

          const companyEl = await card.$('.base-search-card__subtitle');
          const company = companyEl ? (await companyEl.innerText()).trim() : '';

          const locationEl = await card.$('.job-search-card__location');
          const location = locationEl ? (await locationEl.innerText()).trim() : '';

          const urlEl = await card.$('a.base-card__full-link');
          const url = urlEl ? await urlEl.getAttribute('href') : '';
          
          if (!url || !title || !company) continue;

          // Strip query params from url for cleaner ID
          const cleanUrl = url.split('?')[0];
          const jobId = this._generateJobId(cleanUrl);

          // Filter out already-seen job IDs before returning
          const isSeen = await this._isAlreadySeen(jobId, profile.name);
          if (isSeen) {
            console.log(`[LinkedIn] Skipping already seen job: ${title}`);
            continue;
          }

          // Open job detail page for description
          const detailPage = await browser.newPage();
          try {
            await detailPage.goto(cleanUrl, { waitUntil: 'domcontentloaded' });
            await detailPage.waitForTimeout(2000); // 2-second delay

            const descEl = await detailPage.$('.show-more-less-html__markup');
            const description = descEl ? (await descEl.innerHTML()).trim() : '';
            
            // Check for Easy Apply
            const easyApplyEl = await card.$('.result-benefits__text');
            const easyApplyText = easyApplyEl ? (await easyApplyEl.innerText()).trim() : '';
            const easyApply = easyApplyText.toLowerCase().includes('easy apply');

            const postedAtEl = await card.$('.job-search-card__listdate');
            const postedAtText = postedAtEl ? await postedAtEl.getAttribute('datetime') : null;
            const postedAt = postedAtText ? new Date(postedAtText) : new Date();

            const newJob: Partial<IRawJob> = {
              jobId,
              title,
              company,
              location,
              source: 'linkedin',
              url: cleanUrl,
              description,
              postedAt,
              easyApply,
              recruiter: '', // Often not easily available without login
              fetchedAt: new Date(),
              seen: false,
            };
            
            // Save results to MongoDB RawJob collection
            await RawJob.create(newJob);
            jobs.push(newJob);

          } finally {
            await detailPage.close();
          }

        } catch (err) {
          console.error(`[LinkedIn] Error processing a card: ${err}`);
        }
      }

    } catch (err) {
      console.warn(`[LinkedIn] Fetch error: ${err}`);
      return []; // Return empty array on error
    } finally {
      await browser.close();
    }

    return jobs;
  }
}
