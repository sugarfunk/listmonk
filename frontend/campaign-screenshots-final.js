const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:9000/admin/login', { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'adminpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 10000 });

    console.log('✓ Logged in successfully');
    await page.waitForTimeout(2000);

    // Navigate directly to new campaign page
    console.log('Navigating to new campaign...');
    await page.goto('http://localhost:9000/admin/campaigns/new', { waitUntil: 'load' });
    await page.waitForTimeout(3000);

    // Fill campaign details
    console.log('Filling campaign details...');
    const inputs = await page.locator('input.input').all();
    console.log(`Found ${inputs.length} input fields`);

    if (inputs.length >= 2) {
      await inputs[0].fill('Dark Mode Test Campaign');
      await page.waitForTimeout(500);
      await inputs[1].fill('Testing Dark Mode Feature');
      await page.waitForTimeout(500);
    }

    // Select list
    console.log('Selecting list...');
    try {
      await page.click('.list-selector .dropdown-trigger');
      await page.waitForTimeout(1000);
      await page.click('.list-selector .dropdown-menu .dropdown-item:first-child a');
      await page.waitForTimeout(500);
    } catch (e) {
      console.log('⚠ Could not select list:', e.message);
    }

    // Continue to content editor
    console.log('Proceeding to content editor...');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(4000);

    console.log('Current URL:', page.url());

    // Take content editor screenshot
    console.log('Taking content editor screenshot...');
    await page.screenshot({
      path: '/home/user/listmonk/screenshots/campaign-content-editor.png',
      fullPage: false
    });
    console.log('✓ Content editor screenshot saved!');

    // Add content
    console.log('Adding content to editor...');
    try {
      await page.waitForTimeout(2000);
      const frames = page.frames();
      console.log(`Found ${frames.length} frames`);

      let contentAdded = false;
      for (const frame of frames) {
        try {
          const body = frame.locator('body[contenteditable="true"]');
          if (await body.count() > 0) {
            await body.click();
            await body.fill('<h1>Welcome to Dark Mode!</h1><p>This email showcases the new dark mode feature with Material Design Icons from Fontello.</p><ul><li>Sun icon for light mode</li><li>Moon icon for dark mode</li></ul>');
            console.log('✓ Content added');
            contentAdded = true;
            break;
          }
        } catch (e) {}
      }

      if (!contentAdded) {
        console.log('⚠ Could not add content');
      }
    } catch (e) {
      console.log('Error adding content:', e.message);
    }

    await page.waitForTimeout(1000);

    // Preview
    console.log('Opening preview...');
    try {
      await page.click('button:has-text("Preview")');
      await page.waitForTimeout(3000);

      await page.waitForSelector('.modal.is-active', { timeout: 5000 });

      await page.screenshot({
        path: '/home/user/listmonk/screenshots/campaign-preview.png',
        fullPage: false
      });
      console.log('✓ Preview screenshot saved!');
    } catch (e) {
      console.log('Preview error:', e.message);
      await page.screenshot({
        path: '/home/user/listmonk/screenshots/campaign-preview.png',
        fullPage: false
      });
      console.log('✓ Screenshot saved');
    }

    console.log('\n✓✓✓ All screenshots completed! ✓✓✓');

  } catch (error) {
    console.error('\n✗ Error:', error.message);

    try {
      const page = browser.contexts()[0].pages()[0];
      await page.screenshot({
        path: '/home/user/listmonk/screenshots/debug-screenshot.png',
        fullPage: true
      });
      console.log('Debug screenshot saved at:', await page.url());
    } catch (e) {}

  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
