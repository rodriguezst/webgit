import { test, expect } from '@playwright/test';

test.describe('WebGit - Status View', () => {
  test('should load the status page', async ({ page }) => {
    await page.goto('/');

    // Check header is visible
    await expect(page.locator('.logo')).toContainText('WebGit');

    // Check current branch is displayed
    await expect(page.locator('#currentBranch')).toBeVisible();

    // Take screenshot of status view
    await page.screenshot({ path: 'screenshots/status-view.png', fullPage: true });
  });

  test('should display file status correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for status to load
    await page.waitForSelector('#statusContent');

    // Either we have files or the "working tree clean" message
    const statusContent = page.locator('#statusContent');
    await expect(statusContent).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'screenshots/status-content.png', fullPage: true });
  });
});

test.describe('WebGit - History View', () => {
  test('should navigate to history view', async ({ page }) => {
    await page.goto('/');

    // Click on visible history nav link (use bottom nav on mobile)
    await page.click('.bottom-nav-item[data-view="history"], .nav-link[data-view="history"]:visible');

    // Wait for history view to be active
    await expect(page.locator('#historyView')).toHaveClass(/active/);

    // Wait for commits to load
    await page.waitForSelector('#commitList .commit-item, #commitList .empty-state', { timeout: 10000 });

    // Take screenshot
    await page.screenshot({ path: 'screenshots/history-view.png', fullPage: true });
  });

  test('should display commit list', async ({ page }) => {
    await page.goto('/');
    await page.click('.bottom-nav-item[data-view="history"], .nav-link[data-view="history"]:visible');

    // Wait for loading to complete
    await page.waitForFunction(() => {
      const loader = document.querySelector('#commitList .loading');
      return !loader;
    }, { timeout: 10000 });

    // Check if commits are displayed or empty state
    const commitList = page.locator('#commitList');
    await expect(commitList).toBeVisible();
  });
});

test.describe('WebGit - Branches View', () => {
  test('should navigate to branches view', async ({ page }) => {
    await page.goto('/');

    // Click on branches nav link
    await page.click('.bottom-nav-item[data-view="branches"], .nav-link[data-view="branches"]:visible');

    // Wait for branches view to be active
    await expect(page.locator('#branchesView')).toHaveClass(/active/);

    // Wait for branches to load
    await page.waitForSelector('#branchList .branch-item, #branchList .empty-state', { timeout: 10000 });

    // Take screenshot
    await page.screenshot({ path: 'screenshots/branches-view.png', fullPage: true });
  });

  test('should display current branch', async ({ page }) => {
    await page.goto('/');
    await page.click('.bottom-nav-item[data-view="branches"], .nav-link[data-view="branches"]:visible');

    // Wait for loading to complete
    await page.waitForFunction(() => {
      const loader = document.querySelector('#branchList .loading');
      return !loader;
    }, { timeout: 10000 });

    // Check for branch list
    const branchList = page.locator('#branchList');
    await expect(branchList).toBeVisible();
  });

  test('should open new branch modal', async ({ page }) => {
    await page.goto('/');
    await page.click('.bottom-nav-item[data-view="branches"], .nav-link[data-view="branches"]:visible');

    // Wait for page to load
    await page.waitForTimeout(500);

    // Click new branch button
    await page.click('#newBranchBtn');

    // Check modal is open
    await expect(page.locator('#branchModal')).toHaveClass(/open/);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/new-branch-modal.png', fullPage: true });
  });
});

test.describe('WebGit - Remotes View', () => {
  test('should navigate to remotes view', async ({ page }) => {
    await page.goto('/');

    // Click on remotes nav link
    await page.click('.bottom-nav-item[data-view="remotes"], .nav-link[data-view="remotes"]:visible');

    // Wait for remotes view to be active
    await expect(page.locator('#remotesView')).toHaveClass(/active/);

    // Wait for remotes to load
    await page.waitForSelector('#remotesContent', { timeout: 10000 });

    // Take screenshot
    await page.screenshot({ path: 'screenshots/remotes-view.png', fullPage: true });
  });

  test('should display remote repositories', async ({ page }) => {
    await page.goto('/');
    await page.click('.bottom-nav-item[data-view="remotes"], .nav-link[data-view="remotes"]:visible');

    // Wait for loading to complete
    await page.waitForFunction(() => {
      const loader = document.querySelector('#remotesContent .loading');
      return !loader;
    }, { timeout: 10000 });

    // Check for remote content
    const remotesContent = page.locator('#remotesContent');
    await expect(remotesContent).toBeVisible();
  });
});

test.describe('WebGit - Branch Selector', () => {
  test('should open branch selector modal', async ({ page }) => {
    await page.goto('/');

    // Wait for initial load
    await page.waitForTimeout(500);

    // Click on branch selector
    await page.click('#branchSelector');

    // Check modal is open
    await expect(page.locator('#branchModal')).toHaveClass(/open/);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/branch-selector.png', fullPage: true });
  });

  test('should close branch modal when clicking close', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Open modal
    await page.click('#branchSelector');
    await expect(page.locator('#branchModal')).toHaveClass(/open/);

    // Close modal
    await page.click('#closeBranchModal');

    // Check modal is closed
    await expect(page.locator('#branchModal')).not.toHaveClass(/open/);
  });
});

test.describe('WebGit - Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should show bottom navigation on mobile', async ({ page }) => {
    await page.goto('/');

    // Check bottom nav is visible
    const bottomNav = page.locator('.bottom-nav');
    await expect(bottomNav).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'screenshots/mobile-view.png', fullPage: true });
  });

  test('should navigate using bottom nav', async ({ page }) => {
    await page.goto('/');

    // Click history in bottom nav
    await page.click('.bottom-nav-item[data-view="history"]');

    // Check history view is active
    await expect(page.locator('#historyView')).toHaveClass(/active/);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/mobile-history.png', fullPage: true });
  });

  test('should show menu toggle on mobile', async ({ page }) => {
    await page.goto('/');

    // Menu toggle should be visible on mobile
    const menuToggle = page.locator('#menuToggle');
    await expect(menuToggle).toBeVisible();

    // Click to open menu
    await menuToggle.click();

    // Nav should be open
    await expect(page.locator('#mainNav')).toHaveClass(/open/);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/mobile-menu-open.png', fullPage: true });
  });
});

test.describe('WebGit - Responsive Design', () => {
  test('desktop view should hide bottom nav', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');

    // Bottom nav should be hidden on desktop
    const bottomNav = page.locator('.bottom-nav');
    await expect(bottomNav).toBeHidden();

    // Side nav should be visible
    const sideNav = page.locator('#mainNav');
    await expect(sideNav).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'screenshots/desktop-view.png', fullPage: true });
  });

  test('tablet view should work correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Take screenshot
    await page.screenshot({ path: 'screenshots/tablet-view.png', fullPage: true });
  });
});

test.describe('WebGit - API Tests', () => {
  test('API should return status', async ({ request }) => {
    const response = await request.get('/api/status');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('current');
    expect(data).toHaveProperty('files');
  });

  test('API should return branches', async ({ request }) => {
    const response = await request.get('/api/branches');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('current');
    expect(data).toHaveProperty('local');
  });

  test('API should return commits', async ({ request }) => {
    const response = await request.get('/api/commits');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('API should return remotes', async ({ request }) => {
    const response = await request.get('/api/remotes');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });
});
