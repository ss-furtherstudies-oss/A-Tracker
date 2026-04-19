import { chromium } from 'playwright';

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('BROWSER ERROR:', msg.text());
      } else {
        console.log('BROWSER LOG:', msg.text());
      }
    });

    page.on('pageerror', error => {
      console.error('UNHANDLED EXCEPTION:', error.message);
    });

    console.log('Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'load', timeout: 15000 });
    
    // Wait for a little bit to see if any delayed errors pop up
    await page.waitForTimeout(3000);
    
    console.log('Finished capturing.');
    await browser.close();
  } catch (error) {
    console.error('Script Error:', error.message);
  }
})();
