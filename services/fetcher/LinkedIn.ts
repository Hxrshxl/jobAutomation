import { createStealthBrowser } from '../../lib/browserFactory';
import { BaseFetcher, FetchOptions } from './BaseFetcher';
import { Profile } from '../../lib/loadProfiles';
import RawJob, { IRawJob } from '../../models/RawJob';
import { parsePostedDate } from '../../lib/utils';

export class LinkedInFetcher extends BaseFetcher {
  async fetch(profile: Profile, options?: FetchOptions): Promise<Partial<IRawJob>[]> {
    const freshness = options?.runType || 'full';
    const jobs: Partial<IRawJob>[] = [];
    const { browser, context } = await createStealthBrowser();
    
    try {
      const page = await context.newPage();
      await this._setupPage(page);
      
      // Use the first few keywords to avoid a search query that is too specific, or encode properly
      const keywords = encodeURIComponent(profile.keywords.slice(0, 2).join(' '));
      let searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${keywords}&f_E=1`;
      if (freshness === 'fresh') {
        searchUrl += '&f_TPR=r7200&sortBy=DD';
      }
      
      console.log(`[LinkedIn] Navigating to ${searchUrl}`);
      await page.goto(searchUrl, { timeout: 12000, waitUntil: 'domcontentloaded' });
      await this.sleep(3000, 8000); // Randomized delay

      // Scroll a bit to load job cards (LinkedIn lazy loads)
      const maxScrolls = freshness === 'fresh' ? 2 : 5;
      for (let i = 0; i < maxScrolls; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await this.sleep(1000, 2000);
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

          // We extract postedAt sooner to use in ID generation
          const postedAtEl = await card.$('.job-search-card__listdate');
          const postedAtText = postedAtEl ? await postedAtEl.getAttribute('datetime') : null;
          const postedAt = parsePostedDate(postedAtText);

          const jobId = this._generateJobId(cleanUrl, postedAt.toISOString());

          // Filter out already-seen job IDs before returning
          const isSeen = await this._isAlreadySeen(jobId, profile.name, title, company);
          if (isSeen) {
            console.log(`[LinkedIn] Skipping already seen job: ${title}`);
            continue;
          }

          // Open job detail page for description
          const detailPage = await context.newPage();
          try {
            await this._setupPage(detailPage);
            await detailPage.goto(cleanUrl, { timeout: 12000, waitUntil: 'domcontentloaded' });
            await this.sleep(3000, 8000); // Randomized delay

            const descEl = await detailPage.$('.show-more-less-html__markup');
            const description = descEl ? (await descEl.innerHTML()).trim() : '';
            
            // Check for Easy Apply
            const easyApplyEl = await card.$('.result-benefits__text');
            const easyApplyText = easyApplyEl ? (await easyApplyEl.innerText()).trim() : '';
            const easyApply = easyApplyText.toLowerCase().includes('easy apply');

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
