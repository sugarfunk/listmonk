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
    console.log('Navigating to login page...');
    await page.goto('http://localhost:9000/admin/login', { waitUntil: 'networkidle' });

    await page.waitForSelector('input#username', { timeout: 5000 });
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin');

    console.log('Submitting login form...');
    // Use Promise.all to wait for navigation triggered by form submission
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);

    console.log('Current URL after login:', page.url());

    // Verify we're logged in
    if (page.url().includes('/login')) {
      throw new Error('Login failed - still on login page');
    }

    console.log('Logged in successfully');
    await page.waitForTimeout(1000);

    // Navigate to campaigns page
    console.log('Navigating to campaigns list...');
    await page.goto('http://localhost:9000/admin/campaigns', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Click the "New campaign" button
    console.log('Clicking new campaign button...');
    await page.click('a[href="/admin/campaigns/new"]');
    await page.waitForTimeout(2000);

    console.log('Current URL:', page.url());

    // Fill in campaign details
    console.log('Filling in campaign details...');

    // Find input fields
    const inputs = await page.locator('input.input').all();
    console.log(`Found ${inputs.length} input fields`);

    if (inputs.length >= 2) {
      await inputs[0].fill('Dark Mode Test Campaign');
      await page.waitForTimeout(300);
      await inputs[1].fill('Testing Dark Mode Feature');
      await page.waitForTimeout(300);
    }

    // Select a list from dropdown
    console.log('Selecting list...');
    try {
      // Click the dropdown
      await page.click('.list-selector .dropdown-trigger, .list-selector button');
      await page.waitForTimeout(500);

      // Click first available list
      await page.click('.list-selector .dropdown-menu .dropdown-item:first-child a, .list-selector .dropdown-menu .dropdown-item:first-child');
      await page.waitForTimeout(500);
    } catch (e) {
      console.log('Could not select list:', e.message);
    }

    // Click Continue button
    console.log('Clicking continue...');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(3000);

    console.log('Current URL after continue:', page.url());

    // Should now be on content editor page
    console.log('Taking screenshot of content editor...');
    await page.screenshot({
      path: '/home/user/listmonk/screenshots/campaign-content-editor.png',
      fullPage: false
    });
    console.log('Content editor screenshot saved!');

    // Try to add content to the editor
    console.log('Adding content to editor...');
    try {
      await page.waitForTimeout(2000);

      // Find TinyMCE iframe
      const frames = page.frames();
      console.log(`Found ${frames.length} frames`);

      let contentAdded = false;
      for (const frame of frames) {
        try {
          const bodySelector = 'body[contenteditable="true"]';
          const body = frame.locator(bodySelector);

          if (await body.count() > 0) {
            await body.click();
            await body.fill('<h1>Welcome to Dark Mode!</h1><p>This email showcases the new dark mode feature with Material Design Icons from Fontello.</p><ul><li>Sun icon for light mode</li><li>Moon icon for dark mode</li></ul>');
            console.log('Content added successfully');
            contentAdded = true;
            break;
          }
        } catch (e) {
          // Try next frame
        }
      }

      if (!contentAdded) {
        console.log('Could not add content to editor');
      }
    } catch (e) {
      console.log('Error adding content:', e.message);
    }

    await page.waitForTimeout(1000);

    // Click preview button
    console.log('Clicking preview button...');
    try {
      await page.click('button:has-text("Preview")');
      await page.waitForTimeout(3000);

      // Wait for preview modal
      await page.waitForSelector('.modal.is-active', { timeout: 5000 });

      // Take screenshot of preview
      console.log('Taking screenshot of preview...');
      await page.screenshot({
        path: '/home/user/listmonk/screenshots/campaign-preview.png',
        fullPage: false
      });
      console.log('Preview screenshot saved!');
    } catch (e) {
      console.log('Could not capture preview:', e.message);
    }

    console.log('All screenshots completed successfully!');

  } catch (error) {
    console.error('Error:', error.message);

    // Take a debug screenshot
    try {
      const page = browser.contexts()[0].pages()[0];
      await page.screenshot({
        path: '/home/user/listmonk/screenshots/debug-screenshot.png',
        fullPage: true
      });
      console.log('Debug screenshot saved');
      console.log('Current URL:', await page.url());
    } catch (e) {
      console.error('Could not save debug screenshot');
    }

  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
