import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

async function run() {
  console.log('Launching browser for Naukri login...');
  const browser = await chromium.launch({
    headless: false, // Must be headed for manual login
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to naukri.com...');
  await page.goto('https://www.naukri.com/login', { waitUntil: 'domcontentloaded' });

  console.log('\n=============================================');
  console.log('Please log in manually in the opened browser window.');
  console.log('Once you are successfully logged in and on the dashboard, close the browser window to save the session.');
  console.log('=============================================\n');

  // Wait for the user to close the page manually
  await page.waitForEvent('close', { timeout: 0 }); 

  const sessionDir = path.join(process.cwd(), 'data', 'sessions');
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const sessionPath = path.join(sessionDir, 'naukri-session.json');
  await context.storageState({ path: sessionPath });
  console.log(`\n✅ Session saved successfully to ${sessionPath}`);
  
  await browser.close();
}

run().catch(console.error);
