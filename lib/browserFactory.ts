import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import fs from 'fs';

chromium.use(StealthPlugin());

export async function createStealthBrowser(storageStatePath?: string) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
    ]
  });
  
  const contextOptions: any = {};
  if (storageStatePath && fs.existsSync(storageStatePath)) {
    contextOptions.storageState = storageStatePath;
  }
  const context = await browser.newContext(contextOptions);
  context.setDefaultNavigationTimeout(12000);
  context.setDefaultTimeout(8000);

  return { browser, context };
}
