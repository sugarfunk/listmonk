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

    // First, set up the admin user
    console.log('Setting up admin user...');
    await page.goto('http://localhost:9000/admin/login', { waitUntil: 'load' });

    // Fill in new user form
    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'adminpass123');
    await page.fill('input[name="password2"]', 'adminpass123');

    console.log('Submitting user creation form...');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 10000 });

    console.log('Admin user created, current URL:', page.url());
    await page.waitForTimeout(3000);

    // Navigate to campaigns
    console.log('Navigating to campaigns...');
    await page.goto('http://localhost:9000/admin/campaigns', { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    // Click New campaign button
    console.log('Clicking new campaign...');
    await page.click('a[href="/admin/campaigns/new"]');
    await page.waitForTimeout(3000);

    console.log('Current URL:', page.url());

    // Fill campaign form
    console.log('Filling campaign form...');
    const inputs = await page.locator('input.input').all();
    console.log(`Found ${inputs.length} inputs`);

    if (inputs.length >= 2) {
      await inputs[0].fill('Dark Mode Test Campaign');
      await page.waitForTimeout(500);
      await inputs[1].fill('Testing Dark Mode Feature');
      await page.waitForTimeout(500);
    }

    // Select a list
    console.log('Selecting list...');
    try {
      await page.click('.list-selector .dropdown-trigger');
      await page.waitForTimeout(1000);
      await page.click('.list-selector .dropdown-menu .dropdown-item:first-child a');
      await page.waitForTimeout(500);
    } catch (e) {
      console.log('Could not select list:', e.message);
    }

    // Click Continue
    console.log('Clicking continue...');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(4000);

    console.log('Current URL after continue:', page.url());

    // Take screenshot of content editor
    console.log('Taking content editor screenshot...');
    await page.screenshot({
      path: '/home/user/listmonk/screenshots/campaign-content-editor.png',
      fullPage: false
    });
    console.log('✓ Content editor screenshot saved!');

    // Add content to editor
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
            console.log('✓ Content added to editor');
            contentAdded = true;
            break;
          }
        } catch (e) {}
      }

      if (!contentAdded) {
        console.log('⚠ Could not add content to editor');
      }
    } catch (e) {
      console.log('Could not add content:', e.message);
    }

    await page.waitForTimeout(1000);

    // Click Preview
    console.log('Clicking preview button...');
    try {
      await page.click('button:has-text("Preview")');
      await page.waitForTimeout(3000);

      await page.waitForSelector('.modal.is-active', { timeout: 5000 });

      // Take preview screenshot
      console.log('Taking preview screenshot...');
      await page.screenshot({
        path: '/home/user/listmonk/screenshots/campaign-preview.png',
        fullPage: false
      });
      console.log('✓ Preview screenshot saved!');
    } catch (e) {
      console.log('Could not capture preview:', e.message);
      // Try to take a screenshot anyway
      await page.screenshot({
        path: '/home/user/listmonk/screenshots/campaign-preview.png',
        fullPage: false
      });
      console.log('✓ Screenshot saved (preview may not be open)');
    }

    console.log('\n✓ All screenshots completed successfully!');

  } catch (error) {
    console.error('Error:', error.message);

    try {
      const page = browser.contexts()[0].pages()[0];
      await page.screenshot({
        path: '/home/user/listmonk/screenshots/debug-screenshot.png',
        fullPage: true
      });
      console.log('Debug screenshot saved, URL:', await page.url());
    } catch (e) {}

  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
